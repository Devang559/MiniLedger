import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Screen({ children, style }: ScreenProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }, style]} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
