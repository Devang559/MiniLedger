export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: Date;
  is_repaid: boolean;
  receipt_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLoanInput {
  friend_name: string;
  amount: number;
  due_date: string;
  receipt_url?: string | null;
}

export interface SummaryTable {
  id: string;
  user_id: string;
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
  overdue_count: number;
  total_entries: number;
  created_at: Date;
  updated_at: Date;
}

export interface Summary {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
  overdue_count: number;
  total_entries: number;
}
