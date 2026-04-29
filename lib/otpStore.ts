/**
 * OTP store persisted on globalThis so it survives Next.js hot-reloads in dev.
 * In production, replace with Redis for multi-instance support.
 */

type OTPEntry = {
  code: string;
  expiresAt: number;
  verified: boolean;
};

// Attach store to globalThis so it isn't wiped on Turbopack hot-reload
declare const globalThis: { _otpStore?: Map<string, OTPEntry> } & typeof global;
const store: Map<string, OTPEntry> =
  globalThis._otpStore ?? (globalThis._otpStore = new Map());

/** Generate a 6-digit OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Save OTP for a phone number (overwrites any existing) */
export function saveOTP(phone: string, code: string): void {
  store.set(phone, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    verified: false,
  });
}

/** Verify OTP — marks verified if correct and not expired */
export function verifyOTP(
  phone: string,
  code: string
): { ok: boolean; error?: string } {
  const entry = store.get(phone);
  if (!entry) return { ok: false, error: "No OTP found. Please request a new one." };
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return { ok: false, error: "OTP expired. Please request a new one." };
  }
  if (entry.code !== code) return { ok: false, error: "Incorrect OTP. Please try again." };
  store.set(phone, { ...entry, verified: true });
  return { ok: true };
}

/** Check if a phone number has a verified OTP session */
export function isVerified(phone: string): boolean {
  const entry = store.get(phone);
  return !!(entry && entry.verified && Date.now() <= entry.expiresAt);
}

/** Clear OTP after order is placed */
export function clearOTP(phone: string): void {
  store.delete(phone);
}
