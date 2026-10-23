import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Modal, TextInput, Alert, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useLoanStore } from '../store/loanStore';
import { useThemeStore } from '../store/themeStore';
import SummaryCard from '../components/SummaryCard';
import ThemeToggle from '../components/ThemeToggle';
import Screen from '../components/Screen';
import { formatDueDate } from '../utils/formatDate';
import { getCurrencyInfo, formatCurrency, formatAmountInput, parseAmount } from '../utils/currency';
import { api, getReceiptImageUrl } from '../services/api';
import { Loan } from '../types';
import { launchImageLibrary } from 'react-native-image-picker';
import { TurboModuleRegistry } from 'react-native';
import { getColors } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDark } = useThemeStore();
  const { user, countryCode } = useAuthStore();
  const { loans, summary, isLoading, error, fetchLoans, fetchSummary, markRepaid, unmarkRepaid, deleteLoan, updateLoan, clearError } = useLoanStore();

  const colors = getColors(isDark);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

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

  const openEditModal = (loan: Loan) => {
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
      await updateLoan(editingLoan.id, user.id, editName.trim(), parsedAmount, editDueDate, editingLoan?.receipt_url || null);
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update loan');
    }
  };

  const renderLoan = ({ item }: { item: Loan }) => {
    const overdue = isOverdue(item);
    const initial = item.friend_name.trim().charAt(0).toUpperCase() || '?';

    return (
      <View style={[styles.loanItem, overdue && styles.loanItemOverdue, item.is_repaid && styles.loanItemRepaid]}>
        <TouchableOpacity
          style={styles.loanInfo}
          onPress={() => openEditModal(item)}
        >
          <View style={styles.loanTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.loanCopy}>
              <Text style={styles.friendName}>{item.friend_name}</Text>
              <Text style={styles.dueDate}>{formatDueDate(item.due_date)}</Text>
            </View>
            <Text style={[styles.amountText, overdue && styles.amountOverdue]}>{formatCurrency(item.amount, countryCode)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.loanMeta}>
          <View style={[styles.statusBadge, item.is_repaid ? styles.statusBadgeRepaid : overdue ? styles.statusBadgeOverdue : styles.statusBadgePending]}>
            <Text style={[styles.statusText, item.is_repaid ? styles.statusRepaid : overdue ? styles.statusOverdue : styles.statusPending]}>
              {item.is_repaid ? 'Repaid' : overdue ? 'Overdue' : 'Pending'}
            </Text>
          </View>
            {!item.is_repaid && user && (
              <TouchableOpacity
                style={styles.repayButton}
                onPress={() => markRepaid(item.id, user.id)}
              >
                <Text style={styles.repayButtonText}>Mark repaid</Text>
              </TouchableOpacity>
            )}
            {item.receipt_url && (
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={() => {
                  setSelectedReceiptUrl(getReceiptImageUrl(item.receipt_url));
                  setReceiptModalVisible(true);
                }}
              >
                <Text style={styles.receiptButtonText}>Show receipt</Text>
              </TouchableOpacity>
            )}
            {!item.receipt_url && user && (
              <TouchableOpacity
                style={styles.receiptButton}
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
                      const res = await api.uploadReceipt(item.id, {
                        uri: asset.uri || '',
                        name: asset.fileName || 'receipt.jpg',
                        type: asset.type || 'image/jpeg',
                      });
                      if (res.loan && res.loan.receipt_url) {
                        const updatedLoans = loans.map((loan: Loan) =>
                          loan.id === item.id ? { ...loan, receipt_url: res.loan.receipt_url } : loan
                        );
                        useLoanStore.setState({ loans: updatedLoans });
                      }
                      Alert.alert('Success', 'Receipt uploaded');
                    }
                  } catch (err: any) {
                    Alert.alert('Error', err?.message || 'Failed to upload receipt');
                  }
                }}
              >
                <Text style={styles.receiptButtonText}>Upload receipt</Text>
              </TouchableOpacity>
            )}
          {item.is_repaid && user && (
            <View style={styles.repaidActions}>
              <TouchableOpacity
                style={styles.undoButton}
                onPress={() => unmarkRepaid(item.id, user.id)}
              >
                <Text style={styles.undoButtonText}>Undo</Text>
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
                <Text style={styles.deleteButtonText}>Delete</Text>
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
              <Text style={styles.modalTitle}>Edit loan</Text>
              <Text style={styles.modalLabel}>Friend's name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={styles.modalLabel}>Amount ({getCurrencyInfo(countryCode).symbol})</Text>
              <TextInput
                style={styles.modalInput}
                value={editAmount}
                onChangeText={(text) => setEditAmount(formatAmountInput(text, countryCode))}
                keyboardType="numeric"
              />
              <Text style={styles.modalLabel}>Due date</Text>
              <TextInput
                style={styles.modalInput}
                value={editDueDate}
                onChangeText={setEditDueDate}
                placeholder="e.g. 2026-10-25 or 2026-10-25T14:00:00Z"
                placeholderTextColor={colors.textMuted}
              />
              {editingLoan?.receipt_url ? (
                <Image
                  source={{ uri: getReceiptImageUrl(editingLoan.receipt_url) || '' }}
                  style={{ width: '100%', height: 100, borderRadius: 12, marginBottom: 20 }}
                  resizeMode="cover"
                />
              ) : null}
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
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={receiptModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReceiptModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { padding: 24, maxHeight: '80%' }]}>
              <Text style={styles.modalTitle}>Receipt</Text>
              {selectedReceiptUrl ? (
                <Image
                  source={{ uri: selectedReceiptUrl }}
                  style={{ width: '100%', height: 300, borderRadius: 12 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
                    No receipt image.
                  </Text>
                </View>
              )}
              <View style={[styles.modalButtons, { marginTop: 20 }]}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setReceiptModalVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>MiniLedger</Text>
          <Text style={styles.headerTitle}>
            {user?.username ? `Hi, ${user.username}` : 'Your loans'}
          </Text>
        </View>
        <ThemeToggle />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
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
        <Text style={styles.addButtonText}>Add loan</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your loans</Text>
      <FlatList
        data={loans}
        renderItem={renderLoan}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={isLoading} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.emptyText}>Loading loans...</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>ML</Text>
              </View>
              <Text style={styles.emptyText}>No loans yet</Text>
              <Text style={styles.emptySubtext}>Tap “Add loan” to get started</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}

function getStyles(isDark: boolean) {
  const colors = getColors(isDark);

  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerCopy: {
      flex: 1,
      paddingRight: 12,
    },
    headerEyebrow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    errorBanner: {
      backgroundColor: colors.dangerMuted,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorBannerText: {
      color: colors.danger,
      fontSize: 13,
      flex: 1,
      fontWeight: '600',
    },
    errorBannerClose: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: '700',
      paddingLeft: 12,
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    addButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    loanItem: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loanItemOverdue: {
      borderColor: colors.danger,
    },
    loanItemRepaid: {
      opacity: 0.72,
    },
    loanInfo: {
      marginBottom: 12,
    },
    loanTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: isDark ? colors.primary : colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    loanCopy: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    dueDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    amountText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginLeft: 8,
    },
    amountOverdue: {
      color: colors.danger,
    },
    loanMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusBadgePending: {
      backgroundColor: colors.warningMuted,
    },
    statusBadgeOverdue: {
      backgroundColor: colors.dangerMuted,
    },
    statusBadgeRepaid: {
      backgroundColor: colors.successMuted,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    statusPending: {
      color: colors.warning,
    },
    statusOverdue: {
      color: colors.danger,
    },
    statusRepaid: {
      color: colors.success,
    },
    repayButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    repayButtonText: {
      color: '#042F2E',
      fontSize: 12,
      fontWeight: '700',
    },
    receiptButton: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    receiptButtonText: {
      color: isDark ? colors.primary : colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    repaidActions: {
      flexDirection: 'row',
      gap: 8,
    },
    undoButton: {
      backgroundColor: colors.warningMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    undoButtonText: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: '700',
    },
    deleteButton: {
      backgroundColor: colors.dangerMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 48,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyIconText: {
      color: colors.primary,
      fontWeight: '800',
      fontSize: 18,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.text,
      marginTop: 8,
      fontSize: 16,
      fontWeight: '700',
    },
    emptySubtext: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 8,
    },
    listContent: {
      paddingBottom: 32,
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
      width: '88%',
      maxHeight: '70%',
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 16,
      color: colors.text,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 6,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      marginBottom: 16,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surfaceAlt,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButtonSave: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    modalButtonCancel: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.dangerMuted,
    },
    modalButtonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    modalButtonCancelText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
