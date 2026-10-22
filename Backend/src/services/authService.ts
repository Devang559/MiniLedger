import pool from '../config/database';
import { User } from '../models/User';
import { generateOtp, verifyOtp } from '../utils/otpStore';
import { createSummary } from './summaryService';

export interface LoginResponse {
  message: string;
  otp: string;
}

export interface VerifyResponse {
  message: string;
  user: User;
}

export async function login(phone_number: string, username?: string): Promise<LoginResponse> {
  const existingUser = await pool.query<User>(
    'SELECT * FROM users WHERE phone_number = $1',
    [phone_number]
  );

  if (existingUser.rowCount === 0 && !username) {
    throw new Error('username is required for new users');
  }

  if (existingUser.rowCount === 0) {
    const insertResult = await pool.query<User>(
      'INSERT INTO users (phone_number, username) VALUES ($1, $2) RETURNING *',
      [phone_number, username]
    );
    await createSummary(insertResult.rows[0].id);
  }

  const otp = generateOtp(phone_number, username);
  return { message: 'OTP sent (check server log)', otp };
}

export async function verify(phone_number: string, otp: string): Promise<VerifyResponse> {
  const isValid = verifyOtp(phone_number, otp);
  if (!isValid) throw new Error('Invalid or expired OTP');

  const userResult = await pool.query<User>(
    'SELECT * FROM users WHERE phone_number = $1',
    [phone_number]
  );

  if (userResult.rowCount === 0) throw new Error('User not found');

  const user = userResult.rows[0];
  return {
    message: 'Login successful',
    user,
  };
}
