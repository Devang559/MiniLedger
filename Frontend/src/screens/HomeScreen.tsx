import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useLoanStore } from '../store/loanStore';
import { useThemeStore } from '../store/themeStore';
import SummaryCard from '../components/SummaryCard';
import ThemeToggle from '../components/ThemeToggle';
import { formatDueDate } from '../utils/formatDate';
import { getCurrencyInfo, formatCurrency, formatAmountInput, parseAmount } from '../utils/currency';
import { Loan } from '../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDark } = useThemeStore();
  const { user, countryCode } = useAuthStore();
  const { loans, summary, isLoading, error, fetchLoans, fetchSummary, markRepaid, unmarkRepaid, deleteLoan, updateLoan, clearError } = useLoanStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const styles = getStyles(isDark);

  useEffect(() => {
    if (user) {
      fetchLoans(user.id);
      fetchSummary(user.id);
    }
  }, [user, fetchLoans, fetchSummary]);

  const onRefresh = async () => {
    if (user) {
      await fetchLoans(user.id);
      await fetchSummary(user.id);
    }
  };

  const isOverdue = (loan: Loan) => {
    if (loan.is_repaid) return false;
    return new Date(loan.due_date) < new Date();
  };

  const         openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setEditName(loan.friend_name);
    setEditAmount(formatAmountInput(String(loan.amount), countryCode));
    setEditDueDate(loan.due_date);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLoan || !user) return;

    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter friend\'s name');
      return;
    }

    if (editName.trim().length > 16) {
      Alert.alert('Error', 'Name must be at most 16 characters');
      return;
    }

    const parsedAmount = parseAmount(editAmount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      Alert.alert('Error', 'Amount must be at least 10');
      return;
    }

    const parsedDate = new Date(editDueDate);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    try {
      await updateLoan(editingLoan.id, user.id, editName.trim(), parsedAmount, editDueDate);
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update loan');
    }
  };

  const renderLoan = ({ item }: { item: Loan }) => {
    const overdue = isOverdue(item);

    return (
      <View style={[styles.loanItem, overdue && styles.loanItemOverdue, item.is_repaid && styles.loanItemRepaid]}>
        <TouchableOpacity
          style={styles.loanInfo}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.friendName}>{item.friend_name}</Text>
          <Text style={styles.dueDate}>{formatDueDate(item.due_date)}</Text>
          <Text style={[styles.amountText, overdue && styles.amountOverdue]}>{formatCurrency(item.amount, countryCode)}</Text>
        </TouchableOpacity>
        <View style={styles.loanMeta}>
          <View style={[styles.statusBadge, item.is_repaid ? styles.statusBadgeRepaid : overdue ? styles.statusBadgeOverdue : styles.statusBadgePending]}>
            <Text style={[styles.statusText, item.is_repaid ? styles.statusRepaid : overdue ? styles.statusOverdue : styles.statusPending]}>
              {item.is_repaid ? '✓ Repaid' : overdue ? '⚠︎ Overdue' : '⏳ Pending'}
            </Text>
          </View>
          {!item.is_repaid && user && (
            <TouchableOpacity
              style={styles.repayButton}
              onPress={() => markRepaid(item.id, user.id)}
            >
                <Text style={styles.repayButtonText}>✓ Mark Repaid</Text>
            </TouchableOpacity>
          )}
          {item.is_repaid && user && (
            <View style={styles.repaidActions}>
              <TouchableOpacity
                style={styles.undoButton}
                onPress={() => unmarkRepaid(item.id, user.id)}
              >
                <Text style={styles.undoButtonText}>↩︎ Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  Alert.alert(
                    'Delete Loan',
                    'Are you sure you want to delete this loan?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteLoan(item.id, user.id),
                      },
                    ]
                  )
                }
              >
                <Text style={styles.deleteButtonText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Modal
          visible={editModalVisible && editingLoan?.id === item.id}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>✏︎ Edit Loan</Text>
              <Text style={styles.modalLabel}>👤 Friend's Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={styles.modalLabel}>💵 Amount ({getCurrencyInfo(countryCode).symbol})</Text>
              <TextInput
                style={styles.modalInput}
                value={editAmount}
                onChangeText={(text) => setEditAmount(formatAmountInput(text, countryCode))}
                keyboardType="numeric"
              />
              <Text style={styles.modalLabel}>📅 Due Date</Text>
              <TextInput
                style={styles.modalInput}
                value={editDueDate}
                onChangeText={setEditDueDate}
                placeholder="e.g. 2026-10-25 or 2026-10-25T14:00:00Z"
                placeholderTextColor={isDark ? '#888' : '#999'}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSave}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MiniLedger</Text>
        <ThemeToggle />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {summary && <SummaryCard summary={summary} />}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddLoan')}
      >
        <Text style={styles.addButtonText}>✚ Add Loan</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>📋 Your Loans</Text>
      <FlatList
        data={loans}
        renderItem={renderLoan}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={isLoading} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.emptyText}>⏳ Loading loans...</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📄 No loans yet</Text>
              <Text style={styles.emptySubtext}>Tap "✚ Add Loan" to get started</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = isDark
    ? { bg: '#121212', text: '#ffffff', card: '#1e1e1e', border: '#333', sub: '#888888' }
    : { bg: '#f5f5f5', text: '#1a1a1a', card: '#fff', border: '#e0e0e0', sub: '#6b7280' };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    errorBanner: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorBannerText: {
      color: '#991b1b',
      fontSize: 13,
      flex: 1,
    },
    errorBannerClose: {
      color: '#991b1b',
      fontSize: 16,
      fontWeight: '600',
      paddingLeft: 12,
    },
    addButton: {
      backgroundColor: '#6366f1',
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.sub,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    loanItem: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    loanItemOverdue: {
      borderLeftWidth: 3,
      borderLeftColor: '#ef4444',
    },
    loanItemRepaid: {
      opacity: 0.6,
    },
    loanInfo: {
      flex: 1,
      marginBottom: 8,
    },
    friendName: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    dueDate: {
      fontSize: 12,
      color: colors.sub,
      marginTop: 4,
    },
    amountText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    amountOverdue: {
      color: '#ef4444',
    },
    loanMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusBadgePending: {
      backgroundColor: '#fef3c7',
    },
    statusBadgeOverdue: {
      backgroundColor: '#fee2e2',
    },
    statusBadgeRepaid: {
      backgroundColor: '#dcfce7',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusPending: {
      color: '#92400e',
    },
    statusOverdue: {
      color: '#991b1b',
    },
    statusRepaid: {
      color: '#166534',
    },
    repayButton: {
      backgroundColor: '#22c55e',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginLeft: 10,
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    repayButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    repaidActions: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 10,
    },
    undoButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    undoButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.sub,
      marginTop: 20,
      fontSize: 16,
      fontWeight: '500',
    },
    emptySubtext: {
      textAlign: 'center',
      color: colors.sub,
      fontSize: 13,
      marginTop: 8,
      opacity: 0.7,
    },
    listContent: {
      paddingBottom: 20,
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
      width: '85%',
      maxHeight: '70%',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sub,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      marginBottom: 20,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButtonSave: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: '#6366f1',
    },
    modalButtonCancel: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: '#ef4444',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
