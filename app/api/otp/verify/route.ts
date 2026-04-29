import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAllowedNumber } from '@/lib/twilio/client';
import {
  getActiveOtp,
  verifyOtpHash,
  incrementAttempts,
  markVerified,
  MAX_ATTEMPTS,
} from '@/lib/otp/helpers';

const schema = z.object({
  phoneNumber: z.string(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
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
    const { phoneNumber, otp } = parsed.data;

    // 2. Whitelist check
    if (!isAllowedNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'This phone number is not authorised.' },
        { status: 403 }
      );
    }

    // 3. Fetch active OTP record
    const record = await getActiveOtp(phoneNumber);
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'No active OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    // 4. Check expiry
    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'OTP has expired. Please request a new one.',
          code: 'OTP_EXPIRED',
        },
        { status: 410 }
      );
    }

    // 5. Check max attempts (guard — getActiveOtp already filters, but be defensive)
    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many wrong attempts. Please request a new OTP.',
          code: 'MAX_ATTEMPTS',
        },
        { status: 429 }
      );
    }

    // 6. Verify OTP hash
    const isValid = await verifyOtpHash(otp, record.otpHash);

    // 7. Wrong OTP
    if (!isValid) {
      const attempts = await incrementAttempts(record.id);
      const remaining = MAX_ATTEMPTS - attempts;

      if (remaining <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Too many wrong attempts. Please request a new OTP.',
            code: 'MAX_ATTEMPTS',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
          code: 'WRONG_OTP',
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // 8. OTP is valid — mark verified and issue token
    await markVerified(record.id);

    const verificationToken = Buffer.from(
      JSON.stringify({ phoneNumber, verifiedAt: Date.now() })
    ).toString('base64');

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully.',
        verificationToken,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[OTP/verify] error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
