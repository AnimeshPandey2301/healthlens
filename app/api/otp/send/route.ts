import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { twilioClient, TWILIO_FROM, isAllowedNumber } from '@/lib/twilio/client';
import { generateOtp, hashOtp, createOtpRecord, isRateLimited } from '@/lib/otp/helpers';

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

    // 3. Rate limit check
    if (await isRateLimited(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'Too many OTP requests. Please wait 1 hour before trying again.' },
        { status: 429 }
      );
    }

    // 4–6. Generate, hash and persist OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    await createOtpRecord(phoneNumber, otpHash);

    // 7. Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your HealthLens medicine order OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
      from: TWILIO_FROM,
      to: phoneNumber,
    });

    // 8. Success
    return NextResponse.json(
      { success: true, message: 'OTP sent successfully. Check your phone.' },
      { status: 200 }
    );
  } catch (err: unknown) {
    // Determine whether the error came from Twilio (has `status` property)
    const isTwilioErr =
      err instanceof Error && 'status' in err;

    if (isTwilioErr) {
      console.error('[OTP/send] Twilio error:', err);
      return NextResponse.json(
        { success: false, message: 'Failed to send SMS. Please try again.' },
        { status: 500 }
      );
    }

    console.error('[OTP/send] DB error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
