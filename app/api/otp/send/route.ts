import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { twilioClient, TWILIO_FROM, isAllowedNumber } from '@/lib/twilio/client';
import { generateOTP, saveOTP } from '@/lib/otpStore';

const schema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international format e.g. +91XXXXXXXXXX'),
});

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
    const { phoneNumber } = parsed.data;

    // 2. Whitelist check
    if (!isAllowedNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'This phone number is not authorised to place orders.' },
        { status: 403 }
      );
    }

    // 3. Generate OTP and save in-memory (survives hot-reloads via globalThis)
    const otp = generateOTP();
    saveOTP(phoneNumber, otp);

    // 4. Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your HealthLens medicine order OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
      from: TWILIO_FROM,
      to: phoneNumber,
    });

    return NextResponse.json(
      { success: true, message: 'OTP sent successfully. Check your phone.' },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[OTP/send] error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    // Surface Twilio-specific errors in dev, hide in prod
    const clientMessage =
      process.env.NODE_ENV === 'development'
        ? `Failed to send SMS: ${msg}`
        : 'Failed to send SMS. Please try again.';
    return NextResponse.json(
      { success: false, message: clientMessage },
      { status: 500 }
    );
  }
}
