import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const THEME_KEY = '@mini_ledger_theme';

interface ThemeState {
  isDark: boolean;
  isHydrated: boolean;
  toggleTheme: () => void;
  setDark: (isDark: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  isHydrated: false,
  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      AsyncStorage.setItem(THEME_KEY, newIsDark.toString());
      return { isDark: newIsDark };
    }),
  setDark: (isDark) => {
    AsyncStorage.setItem(THEME_KEY, isDark.toString());
    set({ isDark });
  },
  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(THEME_KEY);
      if (value !== null) {
        set({ isDark: value === 'true', isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));

export function useThemeHydrator() {
  const { hydrate, isHydrated } = useThemeStore();
  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);
}
