import { Router, Request, Response } from 'express';
import { login, verify } from '../services/authService';
import { LoginResponse, VerifyResponse } from '../services/authService';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { phone_number, username } = req.body;

  if (!phone_number) {
    res.status(400).json({ error: 'phone_number is required' });
    return;
  }

  if (!/^\+\d{1,3}\d{10}$/.test(phone_number)) {
    res.status(400).json({ error: 'phone_number must be in format +{country_code}{10_digit_number}' });
    return;
  }

  if (username && username.length > 16) {
    res.status(400).json({ error: 'username must be at most 16 characters' });
    return;
  }

  try {
    const result: LoginResponse = await login(phone_number, username);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'username is required for new users' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  const { phone_number, otp } = req.body;

  if (!phone_number || !otp) {
    res.status(400).json({ error: 'phone_number and otp are required' });
    return;
  }

  if (!/^\+\d{1,3}\d{10}$/.test(phone_number)) {
    res.status(400).json({ error: 'phone_number must be in format +{country_code}{10_digit_number}' });
    return;
  }

  try {
    const result: VerifyResponse = await verify(phone_number, otp);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Invalid or expired OTP' ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
