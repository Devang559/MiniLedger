import { create } from 'zustand';
import { Loan, Summary } from '../types';
import { api } from '../services/api';

interface LoanState {
  loans: Loan[];
  summary: Summary | null;
  isLoading: boolean;
  error: string | null;

  fetchLoans: (user_id: string) => Promise<void>;
  fetchSummary: (user_id: string) => Promise<void>;
  addLoan: (user_id: string, friend_name: string, amount: number, due_date: string) => Promise<void>;
  updateLoan: (loan_id: string, user_id: string, friend_name: string, amount: number, due_date: string) => Promise<void>;
  markRepaid: (loan_id: string, user_id: string) => Promise<void>;
  unmarkRepaid: (loan_id: string, user_id: string) => Promise<void>;
  deleteLoan: (loan_id: string, user_id: string) => Promise<void>;
  clearError: () => void;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchLoans: async (user_id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getLoans(user_id);
      set({ loans: response.loans, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSummary: async (user_id) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await api.getSummary(user_id);
      set({ summary, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addLoan: async (user_id, friend_name, amount, due_date) => {
    set({ isLoading: true, error: null });
    try {
      await api.addLoan(user_id, friend_name, amount, due_date);
      const [loansRes, summaryRes] = await Promise.all([
        api.getLoans(user_id),
        api.getSummary(user_id),
      ]);
      set({ loans: loansRes.loans, summary: summaryRes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  markRepaid: async (loan_id, user_id) => {
    set({ isLoading: true, error: null });
    try {
      await api.markRepaid(loan_id);
      const updatedLoans = get().loans.map((loan) =>
        loan.id === loan_id ? { ...loan, is_repaid: true } : loan
      );
      const summaryRes = await api.getSummary(user_id);
      set({ loans: updatedLoans, summary: summaryRes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateLoan: async (loan_id, user_id, friend_name, amount, due_date) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateLoan(loan_id, friend_name, amount, due_date);
      const updatedLoans = get().loans.map((loan) =>
        loan.id === loan_id
          ? { ...loan, friend_name, amount, due_date }
          : loan
      );
      const summaryRes = await api.getSummary(user_id);
      set({ loans: updatedLoans, summary: summaryRes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  unmarkRepaid: async (loan_id, user_id) => {
    set({ isLoading: true, error: null });
    try {
      await api.unmarkRepaid(loan_id);
      const updatedLoans = get().loans.map((loan) =>
        loan.id === loan_id ? { ...loan, is_repaid: false } : loan
      );
      const summaryRes = await api.getSummary(user_id);
      set({ loans: updatedLoans, summary: summaryRes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  deleteLoan: async (loan_id, user_id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteLoan(loan_id);
      const updatedLoans = get().loans.filter((loan) => loan.id !== loan_id);
      const summaryRes = await api.getSummary(user_id);
      set({ loans: updatedLoans, summary: summaryRes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
