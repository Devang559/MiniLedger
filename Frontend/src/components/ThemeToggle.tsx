import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.toggle, isDark && styles.toggleActive]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Text style={[styles.toggleIcon, !isDark && styles.toggleIconActive]}>☀︎</Text>
      <View style={[styles.knob, isDark && styles.knobActive]} />
      <Text style={[styles.toggleIcon, isDark && styles.toggleIconActive]}>☾</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 64,
    height: 34,
    borderRadius: 20,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleActive: {
    backgroundColor: '#4f46e8',
  },
  toggleIcon: {
    fontSize: 14,
    color: '#999',
  },
  toggleIconActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  knob: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    left: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  knobActive: {
    left: 34,
  },
});
