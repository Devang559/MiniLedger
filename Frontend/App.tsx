import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { useThemeStore } from './src/store/themeStore';

export default function App() {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <SafeAreaProvider>
      <StatusBar hidden={false} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
