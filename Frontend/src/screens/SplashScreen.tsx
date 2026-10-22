import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

type SplashScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const { user, isHydrating, hydrate } = useAuthStore();
  const { isDark, hydrate: hydrateTheme } = useThemeStore();

  useEffect(() => {
    const bootstrap = async () => {
      await hydrateTheme();
      await hydrate();
    };
    bootstrap();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!isHydrating) {
      const timer = setTimeout(() => {
        navigation.replace(user ? 'Home' : 'Login');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [navigation, user, isHydrating]);

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoIcon}>💰</Text>
        <Text style={styles.logoText}>MiniLedger</Text>
      </View>
      <Text style={styles.subtitle}>Track money lent to friends</Text>
      <Text style={styles.tagline}>Your pocket ledger, simplified</Text>
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = isDark
    ? { bg: '#121212', text: '#ffffff', sub: '#888888' }
    : { bg: '#ffffff', text: '#1a1a1a', sub: '#6b7280' };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 170,
      height: 170,
      backgroundColor: '#6366f1',
      borderRadius: 85,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
    logoIcon: {
      fontSize: 48,
      marginBottom: -4,
    },
    logoText: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.sub,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    tagline: {
      color: '#6366f1',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1,
    },
  });
}
