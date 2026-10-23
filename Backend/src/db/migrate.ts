import pool from '../config/database';

export async function runMigrations() {
  try {
    // Check if receipt_url column exists in loans table
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' AND column_name = 'receipt_url'
    `);

    if (result.rows.length === 0) {
      // Add receipt_url column to existing loans table
      await pool.query('ALTER TABLE loans ADD COLUMN receipt_url TEXT');
      console.log('[Migration] Added receipt_url column to loans table');
    }

    console.log('[Migration] All migrations complete');
  } catch (err: any) {
    console.error('[Migration] Error:', err.message);
  }
}
