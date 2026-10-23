import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Summary } from '../types';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { getColors } from '../theme';

interface SummaryCardProps {
  summary: Summary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const { isDark } = useThemeStore();
  const { countryCode } = useAuthStore();
  const colors = getColors(isDark);
  const styles = getStyles(isDark);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total lent</Text>
        <Text style={styles.heroValue}>{formatCurrency(summary.total_lent, countryCode)}</Text>
        <Text style={styles.heroHint}>{summary.total_entries} loan {summary.total_entries === 1 ? 'entry' : 'entries'}</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.metric, { backgroundColor: colors.successMuted }]}>
          <Text style={[styles.metricLabel, { color: colors.success }]}>Repaid</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {formatCurrency(summary.total_repaid, countryCode)}
          </Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.dangerMuted }]}>
          <Text style={[styles.metricLabel, { color: colors.danger }]}>
            Overdue{summary.overdue_count ? ` · ${summary.overdue_count}` : ''}
          </Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>
            {formatCurrency(summary.overdue_amount, countryCode)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = getColors(isDark);

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    hero: {
      backgroundColor: isDark ? colors.surfaceAlt : colors.primary,
      borderRadius: 18,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? colors.textMuted : 'rgba(255,255,255,0.78)',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    heroValue: {
      fontSize: 32,
      fontWeight: '800',
      color: isDark ? colors.primary : '#FFFFFF',
      letterSpacing: -0.8,
      marginTop: 6,
    },
    heroHint: {
      marginTop: 6,
      fontSize: 13,
      color: isDark ? colors.textMuted : 'rgba(255,255,255,0.72)',
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    metric: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    metricLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
      marginBottom: 6,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
