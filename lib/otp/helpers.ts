import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const ROUNDS = parseInt(process.env.OTP_HASH_ROUNDS ?? '12', 10);
const OTP_EXPIRY_MINUTES = 10;
export const MAX_ATTEMPTS = 3;
const RATE_LIMIT_REQUESTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

/** Generate a 6-digit OTP string */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Hash an OTP using bcrypt */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, ROUNDS);
}

/** Compare a plain OTP against a stored bcrypt hash */
export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/** Returns the expiry Date (now + OTP_EXPIRY_MINUTES) */
export function getExpiryTime(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

/** Create a new OTP record in the database */
export async function createOtpRecord(phoneNumber: string, otpHash: string) {
  return prisma.otpRecord.create({
    data: {
      phoneNumber,
      otpHash,
      expiresAt: getExpiryTime(),
    },
  });
}

/**
 * Returns true if the phone number has hit the rate limit.
 * (Inverse of the old checkRateLimit — clearer naming for callers)
 */
export async function isRateLimited(phoneNumber: string): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);
  const count = await prisma.otpRecord.count({
    where: { phoneNumber, createdAt: { gte: windowStart } },
  });
  return count >= RATE_LIMIT_REQUESTS;
}

/** Fetch the latest active (unverified, not exhausted) OTP record for a phone */
export async function getActiveOtp(phoneNumber: string) {
  return prisma.otpRecord.findFirst({
    where: {
      phoneNumber,
      verified: false,
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Increment attempt count and return the new total */
export async function incrementAttempts(id: string): Promise<number> {
  const updated = await prisma.otpRecord.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
  return updated.attempts;
}

/** Mark an OTP record as verified (alias: markVerified) */
export async function markVerified(id: string): Promise<void> {
  await prisma.otpRecord.update({
    where: { id },
    data: { verified: true },
  });
}

/** @deprecated Use markVerified */
export const markOtpVerified = markVerified;

/** Exhaust an OTP record so it can't be used again */
export async function invalidateOtp(id: string): Promise<void> {
  await prisma.otpRecord.update({
    where: { id },
    data: { attempts: MAX_ATTEMPTS },
  });
}

// Legacy aliases
export const checkRateLimit = async (phone: string) => !(await isRateLimited(phone));
export const getLatestOtp = getActiveOtp;
