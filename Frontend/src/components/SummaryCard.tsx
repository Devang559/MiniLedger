import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Summary } from '../types';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';

interface SummaryCardProps {
  summary: Summary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const { isDark } = useThemeStore();
  const { countryCode } = useAuthStore();
  const styles = getStyles(isDark);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardTitle}>Summary</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>💰</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.total_lent, countryCode)}</Text>
          <Text style={styles.metricLabel}>Total Lent</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>✓</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.total_repaid, countryCode)}</Text>
          <Text style={styles.metricLabel}>Total Repaid</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>⚠︎</Text>
          <Text style={[styles.metricValue, styles.overdueValue]}>{formatCurrency(summary.overdue_amount, countryCode)}</Text>
          <Text style={styles.metricLabel}>Overdue</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>📋</Text>
          <Text style={styles.metricValue}>{summary.total_entries}</Text>
          <Text style={styles.metricLabel}>Total Entries</Text>
        </View>
      </View>
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = isDark
    ? { bg: '#1e1e1e', text: '#ffffff', sub: '#888888', border: '#2a2a2a' }
    : { bg: '#fff', text: '#1a1a1a', sub: '#6b7280', border: '#e0e0e0' };

  return StyleSheet.create({
    card: {
      backgroundColor: colors.bg,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sub,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    metric: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
    },
    metricIcon: {
      fontSize: 18,
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.sub,
      marginTop: 4,
    },
    overdueValue: {
      color: '#ef4444',
    },
  });
}
