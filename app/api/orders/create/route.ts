import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { isAllowedNumber } from '@/lib/twilio/client';

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
  deliveryAddress: z.string().min(10).max(500),
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
    try {
      const decoded = JSON.parse(
        Buffer.from(verificationToken, 'base64').toString('utf-8')
      ) as { phoneNumber: string; verifiedAt: number };

      if (decoded.phoneNumber !== phoneNumber) {
        return NextResponse.json(
          { success: false, message: 'Verification token mismatch.' },
          { status: 403 }
        );
      }

      const tokenAge = Date.now() - decoded.verifiedAt;
      if (tokenAge > TOKEN_MAX_AGE_MS) {
        return NextResponse.json(
          {
            success: false,
            message: 'Verification expired. Please verify OTP again.',
          },
          { status: 410 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid verification token.' },
        { status: 400 }
      );
    }

    // 4. Create order in DB
    const order = await prisma.medicineOrder.create({
      data: {
        phoneNumber,
        patientName,
        medicines,
        deliveryAddress,
        notes,
        otpVerified: true,
        status: 'confirmed',
      },
    });

    // 5. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully!',
        data: {
          orderId: order.id,
          status: order.status,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[orders/create] DB error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
