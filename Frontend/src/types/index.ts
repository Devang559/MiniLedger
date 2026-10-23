export interface User {
  id: string;
  phone_number: string;
  username: string | null;
}

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: string;
  is_repaid: boolean;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
  overdue_count: number;
  total_entries: number;
}

export interface LoginResponse {
  message: string;
  otp: string;
}

export interface VerifyResponse {
  message: string;
  user: User;
}
