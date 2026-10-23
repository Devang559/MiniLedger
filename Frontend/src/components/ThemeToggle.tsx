import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        {
          backgroundColor: isDark ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Text style={[styles.toggleIcon, !isDark && { color: colors.warning }]}>☀︎</Text>
      <View
        style={[
          styles.knob,
          { backgroundColor: colors.primary },
          isDark && styles.knobActive,
        ]}
      />
      <Text style={[styles.toggleIcon, isDark && { color: colors.primary }]}>☾</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 68,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  toggleIcon: {
    fontSize: 13,
    color: '#8BA0AD',
    zIndex: 1,
  },
  knob: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    left: 5,
  },
  knobActive: {
    left: 37,
  },
});
