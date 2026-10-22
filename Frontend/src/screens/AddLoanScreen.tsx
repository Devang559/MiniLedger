import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useLoanStore } from '../store/loanStore';
import { useThemeStore } from '../store/themeStore';
import { getCurrencyInfo, formatAmountInput, parseAmount } from '../utils/currency';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(year, month, 1 - startDay + i));
  }
  return dates;
}

function formatDateButton(dateStr: string): string {
  if (!dateStr) return 'Select a date';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Select a date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type AddLoanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddLoan'>;
};

export default function AddLoanScreen({ navigation }: AddLoanScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { isDark } = useThemeStore();
  const { user, countryCode } = useAuthStore();
  const { addLoan, fetchLoans, fetchSummary, isLoading, error, clearError } = useLoanStore();

  const styles = getStyles(isDark);

  const handleSelectDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDueDateStr(dateStr);
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarMonth(today);
    handleSelectDate(today);
  };

  const handleClearDate = () => {
    setDueDateStr('');
    setDatePickerVisible(false);
  };

  const prevMonth = () => {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const calendarDates = getCalendarDates(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const renderDateCell = ({ item }: { item: Date }) => {
    const inMonth = item.getMonth() === calendarMonth.getMonth();
    const selected = dueDateStr && isSameDay(new Date(dueDateStr), item);
    const isTodayFlag = isToday(item);

    return (
      <TouchableOpacity
        style={[
          styles.dateCell,
          !inMonth && styles.dateCellInactive,
          selected && styles.dateCellSelected,
        ]}
        onPress={() => handleSelectDate(item)}
        disabled={!inMonth}
      >
        <Text
          style={[
            styles.dateCellText,
            !inMonth && styles.dateCellInactiveText,
            selected && styles.dateCellSelectedText,
            isTodayFlag && !selected && styles.dateCellTodayText,
          ]}
        >
          {item.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleAddLoan = async () => {
    clearError();

    if (!friendName.trim()) {
      Alert.alert('Error', 'Please enter friend\'s name');
      return;
    }

    if (friendName.trim().length > 16) {
      Alert.alert('Error', 'Friend\'s name must be at most 16 characters');
      return;
    }

    const parsedAmount = parseAmount(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      Alert.alert('Error', 'Amount must be at least 10');
      return;
    }

    if (!dueDateStr) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }

    const parsedDate = new Date(dueDateStr);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Error', 'Please select a valid date');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      await addLoan(user.id, friendName.trim(), parsedAmount, parsedDate.toISOString());
      await fetchLoans(user.id);
      await fetchSummary(user.id);
      Alert.alert('Success', 'Loan entry added', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add loan');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Loan Entry</Text>
      </View>

      <Text style={styles.label}>👤 Friend's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Alice"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={friendName}
        onChangeText={setFriendName}
      />

      <Text style={styles.label}>💵 Amount ({getCurrencyInfo(countryCode).symbol})</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 1,500"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={amount}
        onChangeText={(text) => setAmount(formatAmountInput(text, countryCode))}
        keyboardType="numeric"
      />

      <Text style={styles.label}>📅 Due Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text
          style={[
            styles.dateButtonText,
            !dueDateStr && styles.dateButtonPlaceholderText,
          ]}
        >
          {formatDateButton(dueDateStr)}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleAddLoan}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '⏳ Saving...' : '✚ Add Loan'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Select Due Date</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavButton}>
                <Text style={styles.calendarNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthYear}>
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton}>
                <Text style={styles.calendarNavText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dayNamesRow}>
              {DAY_NAMES.map((day) => (
                <Text key={day} style={styles.dayNameText}>
                  {day}
                </Text>
              ))}
            </View>

            <FlatList
              data={calendarDates}
              keyExtractor={(_, idx) => `date-${idx}`}
              renderItem={renderDateCell}
              numColumns={7}
              scrollEnabled={false}
            />

            <View style={styles.calendarFooter}>
              <TouchableOpacity style={styles.calendarFooterButton} onPress={handleClearDate}>
                <Text style={styles.calendarFooterButtonText}>🗑 Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarFooterButton} onPress={handleToday}>
                <Text style={styles.calendarFooterButtonText}>📅 Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarFooterButton, styles.calendarDoneButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.calendarDoneButtonText}>✓ Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = isDark
    ? { bg: '#121212', text: '#ffffff', input: '#1e1e1e', border: '#333', error: '#ef4444', sub: '#888888', card: '#1e1e1e' }
    : { bg: '#ffffff', text: '#1a1a1a', input: '#f5f5f5', border: '#e0e0e0', error: '#ef4444', sub: '#6b7280', card: '#ffffff' };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 24,
      paddingTop: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    backButton: {
      color: '#6366f1',
      fontSize: 16,
      fontWeight: '600',
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sub,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
    },
    dateButton: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
      justifyContent: 'center',
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    dateButtonPlaceholderText: {
      fontSize: 16,
      color: isDark ? '#888' : '#999',
    },
    button: {
      backgroundColor: '#6366f1',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    error: {
      color: colors.error,
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '75%',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    calendarNavButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.input,
    },
    calendarNavText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    calendarMonthYear: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    dayNamesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dayNameText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.sub,
      textAlign: 'center',
      width: `${100 / 7}%`,
    },
    dateCell: {
      width: `${100 / 7}%`,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginBottom: 4,
    },
    dateCellInactive: {
      opacity: 0.3,
    },
    dateCellSelected: {
      backgroundColor: '#6366f1',
    },
    dateCellText: {
      fontSize: 14,
      color: colors.text,
    },
    dateCellInactiveText: {
      opacity: 0.3,
    },
    dateCellSelectedText: {
      color: '#fff',
      fontWeight: '600',
    },
    dateCellTodayText: {
      fontWeight: '600',
      color: '#6366f1',
    },
    calendarFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    calendarFooterButton: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.input,
    },
    calendarFooterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    calendarDoneButton: {
      backgroundColor: '#6366f1',
    },
    calendarDoneButtonText: {
      color: '#fff',
    },
  });
}
