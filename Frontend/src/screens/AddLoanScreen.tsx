import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useLoanStore } from '../store/loanStore';
import { useThemeStore } from '../store/themeStore';
import { getCurrencyInfo, formatAmountInput, parseAmount } from '../utils/currency';
import { api } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { TurboModuleRegistry } from 'react-native';
import { getColors } from '../theme';
import Screen from '../components/Screen';

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
  const [receiptFile, setReceiptFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  const { isDark } = useThemeStore();
  const { user, countryCode } = useAuthStore();
  const { addLoan, fetchLoans, fetchSummary, isLoading, error, clearError } = useLoanStore();

  const styles = getStyles(isDark);
  const colors = getColors(isDark);

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
      const result = await addLoan(user.id, friendName.trim(), parsedAmount, parsedDate.toISOString());
      await fetchLoans(user.id);
      await fetchSummary(user.id);

      if (receiptFile) {
        try {
          const loanId = result?.loan?.id || useLoanStore.getState().loans[0]?.id;
          if (loanId) {
            await api.uploadReceipt(loanId, receiptFile);
            await fetchLoans(user.id);
          }
        } catch (receiptErr: any) {
          Alert.alert('Warning', 'Loan added but receipt upload failed: ' + receiptErr.message);
        }
      }

      Alert.alert('Success', 'Loan entry added', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add loan');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backChip} onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Loan Entry</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Friend's name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alice"
              placeholderTextColor={colors.textMuted}
              value={friendName}
              onChangeText={setFriendName}
            />

            <Text style={styles.label}>Amount ({getCurrencyInfo(countryCode).symbol})</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1,500"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={(text) => setAmount(formatAmountInput(text, countryCode))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Due date</Text>
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

            <Text style={styles.label}>Receipt image (optional)</Text>
            <TouchableOpacity
              style={styles.receiptPickerButton}
              onPress={async () => {
                try {
                  const module = TurboModuleRegistry.get('ImagePicker');
                  if (!module) {
                    Alert.alert('Error', 'Receipt picker requires APK rebuild. Run: cd Frontend && npx react-native run-android');
                    return;
                  }
                  const result = await launchImageLibrary({
                    mediaType: 'photo',
                    quality: 0.8,
                  });
                  if (result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    setReceiptFile({
                      uri: asset.uri || '',
                      name: asset.fileName || 'receipt.jpg',
                      type: asset.type || 'image/jpeg',
                    });
                  }
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'Failed to pick image');
                }
              }}
            >
              <Text style={styles.receiptPickerButtonText}>
                {receiptFile ? 'Change receipt' : 'Choose receipt image'}
              </Text>
            </TouchableOpacity>

            {receiptFile ? (
              <Image
                source={{ uri: receiptFile.uri }}
                style={styles.receiptPreview}
                resizeMode="cover"
              />
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleAddLoan}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Add Loan'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select due date</Text>
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
                <Text style={styles.calendarFooterButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarFooterButton} onPress={handleToday}>
                <Text style={styles.calendarFooterButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarFooterButton, styles.calendarDoneButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.calendarDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function getStyles(isDark: boolean) {
  const colors = getColors(isDark);

  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 18,
    },
    backChip: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    backButton: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 8,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      marginBottom: 18,
    },
    dateButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 18,
      justifyContent: 'center',
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    dateButtonPlaceholderText: {
      fontSize: 16,
      color: colors.textMuted,
      fontWeight: '400',
    },
    receiptPickerButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 16,
      marginBottom: 18,
      alignItems: 'center',
    },
    receiptPickerButtonText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '700',
    },
    receiptPreview: {
      width: '100%',
      height: 140,
      borderRadius: 16,
      marginBottom: 20,
      backgroundColor: colors.surfaceAlt,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    error: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      borderRadius: 24,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.surface,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    calendarNavButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    calendarNavText: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    calendarMonthYear: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    dayNamesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dayNameText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      width: `${100 / 7}%`,
    },
    dateCell: {
      width: `${100 / 7}%`,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginBottom: 4,
    },
    dateCellInactive: {
      opacity: 0.3,
    },
    dateCellSelected: {
      backgroundColor: colors.primary,
    },
    dateCellText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    dateCellInactiveText: {
      opacity: 0.3,
    },
    dateCellSelectedText: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
    dateCellTodayText: {
      fontWeight: '700',
      color: colors.primary,
    },
    calendarFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    calendarFooterButton: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    calendarFooterButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    calendarDoneButton: {
      backgroundColor: colors.primary,
    },
    calendarDoneButtonText: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
  });
}
