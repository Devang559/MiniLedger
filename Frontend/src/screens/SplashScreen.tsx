import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme';

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
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={styles.logo}>
        <Text style={styles.logoMark}>ML</Text>
      </View>
      <Text style={styles.logoText}>MiniLedger</Text>
      <Text style={styles.subtitle}>Track money lent to friends</Text>
      <Text style={styles.tagline}>Your pocket ledger, simplified</Text>
    </View>
  );
}

function getStyles(isDark: boolean) {
  const colors = getColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbOne: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: colors.primary,
      opacity: isDark ? 0.12 : 0.14,
      top: -60,
      right: -80,
    },
    orbTwo: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.primary,
      opacity: isDark ? 0.1 : 0.1,
      bottom: 40,
      left: -90,
    },
    logo: {
      width: 108,
      height: 108,
      backgroundColor: colors.primary,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 10,
    },
    logoMark: {
      color: colors.onPrimary,
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    logoText: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
      marginTop: 10,
    },
    tagline: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginTop: 8,
      textTransform: 'uppercase',
    },
  });
}
