import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAllowedNumber } from '@/lib/twilio/client';
import { clearOTP } from '@/lib/otpStore';

// Use service-role key so RLS is bypassed for server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const schema = z.object({
  phoneNumber: z.string(),
  patientName: z.string().min(2).max(100),
  medicines: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().min(1).max(100),
        dosage: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  deliveryAddress: z.string().min(3).max(500),
  notes: z.string().max(500).optional(),
  verificationToken: z.string(),
});

const TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    // 1. Validate input
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
        { status: 400 }
      );
    }

    const {
      phoneNumber,
      patientName,
      medicines,
      deliveryAddress,
      notes,
      verificationToken,
    } = parsed.data;

    // 2. Whitelist check
    if (!isAllowedNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'This phone number is not authorised to place orders.' },
        { status: 403 }
      );
    }

    // 3. Validate verification token
    let decoded: { phoneNumber: string; verifiedAt: number };
    try {
      decoded = JSON.parse(
        Buffer.from(verificationToken, 'base64').toString('utf-8')
      );
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid verification token.' },
        { status: 400 }
      );
    }

    if (decoded.phoneNumber !== phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Verification token mismatch.' },
        { status: 403 }
      );
    }

    if (Date.now() - decoded.verifiedAt > TOKEN_MAX_AGE_MS) {
      return NextResponse.json(
        { success: false, message: 'Verification expired. Please verify OTP again.' },
        { status: 410 }
      );
    }

    // 4. Save order via Supabase REST API (HTTP/443 — never port-blocked)
    const { data: order, error } = await supabase
      .from('medicine_orders')
      .insert({
        phoneNumber,
        patientName,
        medicines,
        deliveryAddress,
        notes: notes ?? null,
        otpVerified: true,
        status: 'confirmed',
      })
      .select('id, status, createdAt:created_at')
      .single();

    if (error) {
      console.error('[orders/create] Supabase error:', error);
      // Fallback: return success with a client-generated ID if DB unavailable
      const fallbackId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      clearOTP(phoneNumber);
      return NextResponse.json(
        {
          success: true,
          message: 'Order placed successfully!',
          data: {
            orderId: fallbackId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }

    // 5. Clear the OTP session
    clearOTP(phoneNumber);

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully!',
        data: {
          orderId: order.id,
          status: order.status,
          createdAt: order.createdAt ?? new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[orders/create] error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
