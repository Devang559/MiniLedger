import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

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

  const { isDark } = useThemeStore();
  const { otp, isLoading, error, login, verify, clearError } = useAuthStore();

  const styles = getStyles(isDark);

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
    login(fullPhoneNumber, username, countryCode).then(() => {
      setShowOtp(true);
    });
  };

  const handleVerifyOtp = () => {
    if (!otpInput.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    if (!/^\d{6}$/.test(otpInput)) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }
    clearError();
    verify(fullPhoneNumber, otpInput).then(() => {
      if (!error) {
        navigation.replace('Home');
      }
    });
  };

  return (
    <View style={styles.container}>
      {!showOtp ? (
        <>
          <Text style={styles.title}>🔑 Login to MiniLedger</Text>

          <Text style={styles.label}>📱 Phone Number</Text>
          <View style={styles.phoneRow}>
             <TouchableOpacity
               style={[styles.countryCodeButton, { borderColor: isDark ? '#333' : '#ddd' }]}
               onPress={() => setCountryPickerVisible(true)}
             >
               <Text style={[styles.countryCodeText, { color: isDark ? '#fff' : '#333' }]}>{countryCode || 'Select'} ▼</Text>
             </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="1234567890"
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>👤 Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? '#888' : '#999'}
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
          <Text style={styles.title}>🔒 Enter OTP</Text>
          <Text style={styles.subtitle}>OTP sent to {fullPhoneNumber}</Text>
          <Text style={styles.hint}>Check server log for OTP: {otp}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={otpInput}
            onChangeText={setOtpInput}
            keyboardType="number-pad"
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

      <Modal
        visible={countryPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryCodeOption}
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
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = isDark
    ? { bg: '#121212', text: '#ffffff', input: '#1e1e1e', border: '#333', error: '#ef4444', card: '#1e1e1e', sub: '#888888' }
    : { bg: '#ffffff', text: '#1a1a1a', input: '#f5f5f5', border: '#e0e0e0', error: '#ef4444', card: '#ffffff', sub: '#6b7280' };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 24,
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: colors.sub,
      marginBottom: 32,
      textAlign: 'center',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sub,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    countryCodeButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      minWidth: 80,
      alignItems: 'center',
      backgroundColor: colors.input,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    countryCodeText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    phoneInput: {
      flex: 1,
      marginBottom: 0,
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
    hint: {
      fontSize: 12,
      color: colors.sub,
      marginBottom: 12,
      textAlign: 'center',
    },
    button: {
      backgroundColor: '#6366f1',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    link: {
      color: '#6366f1',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500',
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
    countryCodeOption: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    countryCodeOptionText: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalButton: {
      backgroundColor: '#ef4444',
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
