import pool from '../config/database';
import { Summary, SummaryTable } from '../models/Loan';

export async function calculateSummary(user_id: string): Promise<Summary> {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(amount), 0) AS total_lent,
       COALESCE(SUM(CASE WHEN is_repaid THEN amount ELSE 0 END), 0) AS total_repaid,
       COALESCE(SUM(CASE WHEN NOT is_repaid AND due_date < NOW() THEN amount ELSE 0 END), 0) AS overdue_amount,
       COUNT(CASE WHEN NOT is_repaid AND due_date < NOW() THEN 1 END) AS overdue_count,
       COUNT(*) AS total_entries
     FROM loans
     WHERE user_id = $1`,
    [user_id]
  );

  const row = result.rows[0];
  return {
    total_lent: parseFloat(row.total_lent) || 0,
    total_repaid: parseFloat(row.total_repaid) || 0,
    overdue_amount: parseFloat(row.overdue_amount) || 0,
    overdue_count: parseInt(row.overdue_count, 10) || 0,
    total_entries: parseInt(row.total_entries, 10) || 0,
  };
}

export async function getSummary(user_id: string): Promise<Summary> {
  const summary = await calculateSummary(user_id);
  await upsertSummary(user_id, summary);
  return summary;
}

export async function createSummary(user_id: string): Promise<void> {
  await pool.query(
    `INSERT INTO summaries (user_id, total_lent, total_repaid, overdue_amount, overdue_count, total_entries)
     VALUES ($1, 0, 0, 0, 0, 0)`,
    [user_id]
  );
}

export async function upsertSummary(user_id: string, summary: Summary): Promise<void> {
  await pool.query(
    `INSERT INTO summaries
       (user_id, total_lent, total_repaid, overdue_amount, overdue_count, total_entries, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       total_lent = EXCLUDED.total_lent,
       total_repaid = EXCLUDED.total_repaid,
       overdue_amount = EXCLUDED.overdue_amount,
       overdue_count = EXCLUDED.overdue_count,
       total_entries = EXCLUDED.total_entries,
       updated_at = NOW()`,
    [
      user_id,
      summary.total_lent,
      summary.total_repaid,
      summary.overdue_amount,
      summary.overdue_count,
      summary.total_entries,
    ]
  );
}

export async function getStoredSummary(user_id: string): Promise<SummaryTable | null> {
  const result = await pool.query<SummaryTable>(
    'SELECT * FROM summaries WHERE user_id = $1',
    [user_id]
  );
  return (result.rowCount || 0) > 0 ? result.rows[0] : null;
}
