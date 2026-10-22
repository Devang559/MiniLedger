import { randomInt } from 'crypto';

export interface OtpRecord {
  otp: string;
  phone_number: string;
  username: string | null;
  expires_at: number;
}

const otpStore = new Map<string, OtpRecord>();

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

export function generateOtp(phone_number: string, username?: string): string {
  const otp = randomInt(100000, 999999).toString();
  otpStore.set(phone_number, {
    otp,
    phone_number,
    username: username || null,
    expires_at: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  });

  console.log(`[OTP] OTP for ${phone_number}: ${otp}`);

  return otp;
}

export function verifyOtp(phone_number: string, otp: string): boolean {
  const record = otpStore.get(phone_number);
  if (!record) return false;
  if (Date.now() > record.expires_at) {
    otpStore.delete(phone_number);
    return false;
  }
  if (record.otp !== otp) return false;
  otpStore.delete(phone_number);
  return true;
}
