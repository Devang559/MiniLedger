import pool from '../config/database';
import { Loan } from '../models/Loan';
import { calculateSummary, upsertSummary } from './summaryService';

export interface AddLoanResponse {
  message: string;
  loan: Loan;
}

export interface GetLoansResponse {
  loans: Loan[];
}

export async function addLoan(
  user_id: string,
  friend_name: string,
  amount: number,
  due_date: string
): Promise<AddLoanResponse> {
  const result = await pool.query<Loan>(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid)
     VALUES ($1, $2, $3, $4, FALSE)
     RETURNING *`,
    [user_id, friend_name, amount, due_date]
  );

  const summary = await calculateSummary(user_id);
  await upsertSummary(user_id, summary);

  return { message: 'Loan entry added', loan: result.rows[0] };
}

export async function getLoans(user_id: string): Promise<GetLoansResponse> {
  const result = await pool.query<Loan>(
    'SELECT * FROM loans WHERE user_id = $1 ORDER BY due_date DESC',
    [user_id]
  );
  return { loans: result.rows };
}

export async function markRepaid(loan_id: string): Promise<AddLoanResponse> {
  const loanResult = await pool.query<Loan>(
    'UPDATE loans SET is_repaid = TRUE WHERE id = $1 RETURNING *',
    [loan_id]
  );
  if (loanResult.rowCount === 0) throw new Error('Loan not found');

  const summary = await calculateSummary(loanResult.rows[0].user_id);
  await upsertSummary(loanResult.rows[0].user_id, summary);

  return { message: 'Loan marked as repaid', loan: loanResult.rows[0] };
}

export async function updateLoan(
  loan_id: string,
  friend_name: string,
  amount: number,
  due_date: string
): Promise<AddLoanResponse> {
  const result = await pool.query<Loan>(
    `UPDATE loans SET friend_name = $1, amount = $2, due_date = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [friend_name, amount, due_date, loan_id]
  );

  if (result.rowCount === 0) throw new Error('Loan not found');

  const summary = await calculateSummary(result.rows[0].user_id);
  await upsertSummary(result.rows[0].user_id, summary);

  return { message: 'Loan updated', loan: result.rows[0] };
}

export async function unmarkRepaid(loan_id: string): Promise<AddLoanResponse> {
  const loanResult = await pool.query<Loan>(
    'UPDATE loans SET is_repaid = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
    [loan_id]
  );
  if (loanResult.rowCount === 0) throw new Error('Loan not found');

  const summary = await calculateSummary(loanResult.rows[0].user_id);
  await upsertSummary(loanResult.rows[0].user_id, summary);

  return { message: 'Loan marked as unpaid', loan: loanResult.rows[0] };
}

export async function deleteLoan(loan_id: string): Promise<{ message: string }> {
  const result = await pool.query<Loan>(
    'DELETE FROM loans WHERE id = $1 RETURNING *',
    [loan_id]
  );
  if (result.rowCount === 0) throw new Error('Loan not found');

  const summary = await calculateSummary(result.rows[0].user_id);
  await upsertSummary(result.rows[0].user_id, summary);

  return { message: 'Loan deleted' };
}
