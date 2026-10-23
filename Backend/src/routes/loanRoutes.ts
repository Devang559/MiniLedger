import { Router, Request, Response } from 'express';
import { addLoan, getLoans, markRepaid, updateLoan, unmarkRepaid, deleteLoan, uploadReceipt } from '../services/loanService';
import { upload } from '../middleware/upload';
import path from 'path';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { user_id, friend_name, amount, due_date, receipt_url } = req.body;

  if (!user_id || !friend_name || amount === undefined || !due_date) {
    res.status(400).json({ error: 'user_id, friend_name, amount, due_date are required' });
    return;
  }

  if (friend_name.length > 16) {
    res.status(400).json({ error: 'friend_name must be at most 16 characters' });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 10) {
    res.status(400).json({ error: 'amount must be a number and at least 10' });
    return;
  }

  try {
    const result = await addLoan(user_id, friend_name, parsedAmount, due_date, receipt_url || null);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  try {
    const result = await getLoans(user_id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:loan_id', async (req: Request, res: Response) => {
  const { loan_id } = req.params;
  const { friend_name, amount, due_date, receipt_url } = req.body;

  if (!friend_name || amount === undefined || !due_date) {
    res.status(400).json({ error: 'friend_name, amount, due_date are required' });
    return;
  }

  if (friend_name.length > 16) {
    res.status(400).json({ error: 'friend_name must be at most 16 characters' });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 10) {
    res.status(400).json({ error: 'amount must be a number and at least 10' });
    return;
  }

  try {
    const result = await updateLoan(loan_id, friend_name, parsedAmount, due_date, receipt_url || null);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Loan not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

router.put('/:loan_id/repaid', async (req: Request, res: Response) => {
  const { loan_id } = req.params;

  if (!loan_id) {
    res.status(400).json({ error: 'loan_id is required' });
    return;
  }

  try {
    const result = await markRepaid(loan_id);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Loan not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

router.put('/:loan_id/unrepaid', async (req: Request, res: Response) => {
  const { loan_id } = req.params;

  if (!loan_id) {
    res.status(400).json({ error: 'loan_id is required' });
    return;
  }

  try {
    const result = await unmarkRepaid(loan_id);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Loan not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

router.delete('/:loan_id', async (req: Request, res: Response) => {
  const { loan_id } = req.params;

  if (!loan_id) {
    res.status(400).json({ error: 'loan_id is required' });
    return;
  }

  try {
    const result = await deleteLoan(loan_id);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Loan not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/:loan_id/receipt', upload.single('receipt'), async (req: Request, res: Response) => {
  const { loan_id } = req.params;

  if (!loan_id) {
    res.status(400).json({ error: 'loan_id is required' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No receipt image uploaded' });
    return;
  }

  const receiptUrl = `/uploads/${req.file.filename}`;

  try {
    const result = await uploadReceipt(loan_id, receiptUrl);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.message === 'Loan not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
