// src/screens/Auth/index.tsx
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC<Props> = ({ navigation }) => {
  // --- Multi-Layer Animation References ---
  const pulseAnim = useRef(new Animated.Value(0)).current; // For ambient glowing orbs
  const ringScale = useRef(new Animated.Value(0.8)).current; // For concentric habit rings
  const ringOpacity = useRef(new Animated.Value(0.3)).current;
  const contentFade = useRef(new Animated.Value(0)).current; // UI entrance fade
  const contentSlide = useRef(new Animated.Value(30)).current; // UI entrance slide

  useEffect(() => {
    // 1. Endless Breathing Animation Loop (Layered Graphic)
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.15,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 0.85,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0.7,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.2,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Content Staggered Entrance Animation
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Dynamic Interpolations ---
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.25],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  // --- Handlers ---
  const handleSignUp = () => {
    navigation.replace('SignUp');
  };

  const handleSignIn = () => {
    navigation.replace('Login');
  };

  const openTerms = () => {
    Linking.openURL('https://example.com/terms').catch((err) =>
      console.warn('Could not open URL', err)
    );
  };

  const openPrivacy = () => {
    Linking.openURL('https://example.com/privacy').catch((err) =>
      console.warn('Could not open URL', err)
    );
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#312E81']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ================= LAYER 1 & 2: MULTI-LAYER ANIMATED BACKGROUND ================= */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Animated Glow Orb 1 (Emerald Accent Glow) */}
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrbPrimary,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Animated Glow Orb 2 (Violet / Slate Accent Glow) */}
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrbSecondary,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Concentric Habit Tracker Momentum Rings */}
        <View style={styles.ringsContainer}>
          <Animated.View
            style={[
              styles.habitRing,
              styles.ringOuter,
              {
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.habitRing,
              styles.ringMiddle,
              {
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <View style={styles.ringCenterBadge}>
            <View style={styles.centerDot} />
          </View>
        </View>
      </View>

      {/* ================= LAYER 3: FOREGROUND CONTENT ================= */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: contentFade,
                transform: [{ translateY: contentSlide }],
              },
            ]}
          >
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>HABIT BUILDER</Text>
            </View>

            <Text style={styles.title}>Small habits.{'\n'}Remarkable wins.</Text>
            <Text style={styles.subtitle}>
              Transform your daily routines into lifelong streaks. Take control of your day now.
            </Text>
          </Animated.View>

          {/* Spacer to keep layout balanced */}
          <View style={styles.flexibleSpacer} />

          {/* Action Buttons & Legal Footer */}
          <Animated.View
            style={[
              styles.bottomContainer,
              {
                opacity: contentFade,
                transform: [{ translateY: contentSlide }],
              },
            ]}
          >
            {/* Primary Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={handleSignUp}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>GET STARTED FREE</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignIn}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                I already have an account. <Text style={styles.boldSignIn}>Sign In</Text>
              </Text>
            </TouchableOpacity>

            {/* Privacy Policy & Terms Footer */}
            <View style={styles.legalFooter}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.linkText} onPress={openTerms}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.linkText} onPress={openPrivacy}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
    justifyContent: 'space-between',
  },

  // --- Background Multi-Layer Graphics Styles ---
  glowOrb: {
    position: 'absolute',
    borderRadius: 1000,
  },
  glowOrbPrimary: {
    width: scaleWidth(260),
    height: scaleWidth(260),
    backgroundColor: 'rgba(16, 185, 129, 0.16)', // Emerald Accent Glow
    top: '22%',
    alignSelf: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  glowOrbSecondary: {
    width: scaleWidth(180),
    height: scaleWidth(180),
    backgroundColor: 'rgba(99, 102, 241, 0.18)', // Indigo/Violet Glow
    top: '30%',
    left: '10%',
  },
  ringsContainer: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
  },
  ringOuter: {
    width: scaleWidth(220),
    height: scaleWidth(220),
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderStyle: 'dashed',
  },
  ringMiddle: {
    width: scaleWidth(150),
    height: scaleWidth(150),
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  ringCenterBadge: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1.5,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: scaleWidth(14),
    height: scaleWidth(14),
    borderRadius: scaleWidth(7),
    backgroundColor: '#34D399',
  },

  // --- Foreground Content Styles ---
  headerContainer: {
    marginTop: scaleHeight(28),
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: scaleHeight(16),
  },
  tagBadgeText: {
    color: '#34D399',
    fontSize: moderateScale(11),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: moderateScale(isTablet ? 42 : 32),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: moderateScale(isTablet ? 50 : 38),
    marginBottom: scaleHeight(12),
  },
  subtitle: {
    fontSize: moderateScale(isTablet ? 19 : 15),
    fontWeight: '400',
    color: 'rgba(226, 232, 240, 0.75)',
    textAlign: 'center',
    lineHeight: moderateScale(isTablet ? 26 : 22),
    paddingHorizontal: scaleWidth(10),
  },
  flexibleSpacer: {
    flex: 1,
  },
  bottomContainer: {
    marginBottom: scaleHeight(12),
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  secondaryButton: {
    marginTop: scaleHeight(18),
    marginBottom: scaleHeight(20),
    paddingVertical: scaleHeight(6),
  },
  secondaryButtonText: {
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: moderateScale(14),
    fontWeight: '400',
  },
  boldSignIn: {
    color: '#34D399',
    fontWeight: '800',
  },
  legalFooter: {
    paddingHorizontal: scaleWidth(10),
  },
  termsText: {
    color: 'rgba(226, 232, 240, 0.5)',
    fontSize: moderateScale(11),
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  linkText: {
    color: '#34D399',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;