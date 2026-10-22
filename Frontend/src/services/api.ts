import { LoginResponse, Summary, VerifyResponse, Loan } from '../types';


//for apk 
 const API_BASE_URL = 'http://192.168.1.1:5000/api';
// when running the frontend via usb debugging, use the following line instead of the above line
//const API_BASE_URL = 'http://localhost:5000/api';


async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: (phone_number: string, username?: string): Promise<LoginResponse> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number, username }),
    }),

  verify: (phone_number: string, otp: string): Promise<VerifyResponse> =>
    apiRequest('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone_number, otp }),
    }),

  addLoan: (user_id: string, friend_name: string, amount: number, due_date: string): Promise<{ message: string; loan: Loan }> =>
    apiRequest('/loans', {
      method: 'POST',
      body: JSON.stringify({ user_id, friend_name, amount, due_date }),
    }),

  getLoans: (user_id: string): Promise<{ loans: Loan[] }> =>
    apiRequest(`/loans/${user_id}`, {
      method: 'GET',
    }),

  markRepaid: (loan_id: string): Promise<{ message: string; loan: Loan }> =>
    apiRequest(`/loans/${loan_id}/repaid`, {
      method: 'PUT',
    }),

  unmarkRepaid: (loan_id: string): Promise<{ message: string; loan: Loan }> =>
    apiRequest(`/loans/${loan_id}/unrepaid`, {
      method: 'PUT',
    }),

  deleteLoan: (loan_id: string): Promise<{ message: string }> =>
    apiRequest(`/loans/${loan_id}`, {
      method: 'DELETE',
    }),

  updateLoan: (loan_id: string, friend_name: string, amount: number, due_date: string): Promise<{ message: string; loan: Loan }> =>
    apiRequest(`/loans/${loan_id}`, {
      method: 'PUT',
      body: JSON.stringify({ friend_name, amount, due_date }),
    }),

  getSummary: (user_id: string): Promise<Summary> =>
    apiRequest(`/summary/${user_id}`, {
      method: 'GET',
    }),
};
