import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { api } from '../services/api';

const SESSION_DURATION_MS = 5 * 60 * 1000;
const USER_KEY = '@mini_ledger_user';
const EXPIRY_KEY = '@mini_ledger_session_expiry';
const COUNTRY_CODE_KEY = '@mini_ledger_country_code';

interface AuthState {
  user: User | null;
  otp: string | null;
  countryCode: string | null;
  isLoading: boolean;
  isHydrating: boolean;
  error: string | null;

  login: (phone_number: string, username?: string, country_code?: string) => Promise<void>;
  verify: (phone_number: string, otp: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  otp: null,
  countryCode: null,
  isLoading: false,
  isHydrating: true,
  error: null,

  login: async (phone_number, username, country_code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(phone_number, username);
      if (country_code) {
        await AsyncStorage.setItem(COUNTRY_CODE_KEY, country_code);
      }
      set({ otp: response.otp, countryCode: country_code || null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  verify: async (phone_number, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.verify(phone_number, otp);
      const expiry = Date.now() + SESSION_DURATION_MS;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      await AsyncStorage.setItem(EXPIRY_KEY, expiry.toString());
      set({ user: response.user, otp: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(EXPIRY_KEY);
    await AsyncStorage.removeItem(COUNTRY_CODE_KEY);
    set({ user: null, otp: null, countryCode: null });
  },

  hydrate: async () => {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      const expiryStr = await AsyncStorage.getItem(EXPIRY_KEY);
      const countryCodeStr = await AsyncStorage.getItem(COUNTRY_CODE_KEY);
      if (userStr && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (Date.now() < expiry) {
          set({ user: JSON.parse(userStr), countryCode: countryCodeStr });
        } else {
          await AsyncStorage.removeItem(USER_KEY);
          await AsyncStorage.removeItem(EXPIRY_KEY);
        }
      }
    } catch (err) {
      console.error('Hydrate error:', err);
    } finally {
      set({ isHydrating: false });
    }
  },

  clearError: () => set({ error: null }),
}));
