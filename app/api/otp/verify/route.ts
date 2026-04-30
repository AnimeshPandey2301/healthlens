import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAllowedNumber } from '@/lib/twilio/client';
import { verifyOTP } from '@/lib/otpStore';

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

    // 3. Verify OTP against in-memory store
    const result = verifyOTP(phoneNumber, otp);

    if (!result.ok) {
      // Map error messages to appropriate HTTP codes
      const isExpired = result.error?.includes('expired');
      return NextResponse.json(
        {
          success: false,
          message: result.error ?? 'Verification failed.',
          code: isExpired ? 'OTP_EXPIRED' : 'WRONG_OTP',
        },
        { status: isExpired ? 410 : 400 }
      );
    }

    // 4. Issue verification token (15-minute expiry)
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
