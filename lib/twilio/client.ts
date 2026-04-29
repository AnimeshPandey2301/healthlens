import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID)  throw new Error('TWILIO_ACCOUNT_SID is not set');
if (!process.env.TWILIO_AUTH_TOKEN)   throw new Error('TWILIO_AUTH_TOKEN is not set');
if (!process.env.TWILIO_PHONE_NUMBER) throw new Error('TWILIO_PHONE_NUMBER is not set');

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
/** Alias used by send route */
export const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

export function getAllowedNumbers(): string[] {
  const raw = process.env.ALLOWED_PHONE_NUMBERS ?? '';
  return raw.split(',').map((n) => n.trim()).filter(Boolean);
}

export function isAllowedNumber(phone: string): boolean {
  return getAllowedNumbers().includes(phone.trim());
}
