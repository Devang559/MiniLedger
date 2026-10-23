import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme';
import Screen from '../components/Screen';

const COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 +1 (US/Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+86', label: '🇨🇳 +86 (China)' },
  { code: '+81', label: '🇯🇵 +81 (Japan)' },
  { code: '+49', label: '🇩🇪 +49 (Germany)' },
  { code: '+33', label: '🇫🇷 +33 (France)' },
  { code: '+52', label: '🇲🇽 +52 (Mexico)' },
];

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [countryCode, setCountryCode] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const { otp, isLoading, error, login, verify, clearError } = useAuthStore();

  const styles = getStyles(isDark);
  const colors = getColors(isDark);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fullPhoneNumber = `${countryCode}${phone}`;

  const validatePhone = (phoneNumber: string): string | null => {
    if (!phoneNumber.trim()) return 'Please enter a phone number';
    if (!/^\d+$/.test(phoneNumber)) return 'Phone number must contain only digits';
    if (phoneNumber.length !== 10) return 'Phone number must be exactly 10 digits';
    return null;
  };

  const handleSendOtp = () => {
    if (!countryCode) {
      Alert.alert('Error', 'Please select a country code');
      return;
    }
    const phoneError = validatePhone(phone);
    if (phoneError) {
      Alert.alert('Error', phoneError);
      return;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    clearError();
    if (username.trim().length > 16) {
      Alert.alert('Error', 'Username must be at most 16 characters');
      return;
    }
    login(fullPhoneNumber, username, countryCode).then((sent) => {
      if (sent) {
        setShowOtp(true);
        setOtpInput('');
      }
    });
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otpInput.trim();
    if (!enteredOtp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    if (!/^\d{6}$/.test(enteredOtp)) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }
    if (otp && enteredOtp !== otp) {
      Alert.alert('Error', 'OTP does not match. Please try again.');
      return;
    }
    clearError();
    const success = await verify(fullPhoneNumber, enteredOtp);
    if (success) {
      navigation.replace('Home');
      return;
    }
    const verifyError = useAuthStore.getState().error || 'Invalid or expired OTP';
    Alert.alert('Error', verifyError);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 24}
      >
        <ScrollView
          contentContainerStyle={[styles.container, keyboardVisible && styles.containerKeyboardOpen]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.brand, keyboardVisible && styles.brandCompact]}>
            {!keyboardVisible ? (
              <View style={styles.logo}>
                <Text style={styles.logoMark}>ML</Text>
              </View>
            ) : null}
            <Text style={styles.appName}>MiniLedger</Text>
            {!keyboardVisible ? (
              <Text style={styles.brandHint}>Keep every loan with friends in one place</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            {!showOtp ? (
              <>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in with your phone number</Text>

                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={[styles.countryCodeButton, { borderColor: colors.border }]}
                    onPress={() => setCountryPickerVisible(true)}
                  >
                    <Text style={[styles.countryCodeText, { color: colors.text }]}>
                      {countryCode || 'Code'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder="1234567890"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Enter OTP</Text>
                <Text style={styles.subtitle}>OTP sent to {fullPhoneNumber}</Text>
                <Text style={styles.hint}>Check server log for OTP: {otp}</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={colors.textMuted}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOtp(false)}>
                  <Text style={styles.link}>Back to login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={countryPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select country code</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryCodeOption,
                    countryCode === item.code && styles.countryCodeOptionActive,
                  ]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryCodeOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCountryPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
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
      flexGrow: 1,
      padding: 24,
      paddingBottom: 40,
      justifyContent: 'center',
    },
    containerKeyboardOpen: {
      justifyContent: 'flex-start',
      paddingTop: 8,
    },
    brand: {
      alignItems: 'center',
      marginBottom: 28,
    },
    brandCompact: {
      marginBottom: 16,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    logoMark: {
      color: colors.onPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    appName: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.6,
    },
    brandHint: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textMuted,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
      marginBottom: 24,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 8,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    countryCodeButton: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginRight: 8,
      minWidth: 86,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    countryCodeText: {
      fontSize: 15,
      fontWeight: '700',
    },
    phoneInput: {
      flex: 1,
      marginBottom: 0,
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
    otpInput: {
      letterSpacing: 4,
      textAlign: 'center',
      fontWeight: '700',
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 12,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    link: {
      color: colors.primary,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 8,
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
      width: '88%',
      maxHeight: '70%',
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
      color: colors.text,
    },
    countryCodeOption: {
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    countryCodeOptionActive: {
      backgroundColor: colors.primaryMuted,
    },
    countryCodeOptionText: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalButton: {
      backgroundColor: colors.dangerMuted,
      padding: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    modalButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
