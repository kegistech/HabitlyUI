// src/screens/ForgotPassword/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';

// --- API Service Configuration ---
// Adjust BASE_URL to match your API config/environment variables
const BASE_URL = 'https://your-api-domain.com/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD';

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  // --- Flow State ---
  const [currentStep, setCurrentStep] = useState<Step>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Resend Timer State
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Focus States
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // --- Animation Setup ---
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Handles smooth transition between steps
  const animateStepTransition = (nextStep: Step) => {
    setErrorMessage('');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // OTP Countdown Timer Logic
  useEffect(() => {
    let interval: any;
    if (currentStep === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);

  // --- Validation Helpers ---
  const isValidEmail = (emailStr: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  // --- API Handlers ---

  // STEP 1: Request OTP for Email
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setTimer(30);
        setCanResend(false);
        animateStepTransition('OTP');
      } else {
        setErrorMessage(data?.message || 'Failed to send OTP code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setErrorMessage('Please enter a valid OTP code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/Auth/verify-forgot-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: trimmedOtp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        animateStepTransition('NEW_PASSWORD');
      } else {
        setErrorMessage(data?.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Password updated successfully!', [
          { text: 'Login', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        setErrorMessage(data?.message || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setTimer(30);
        setCanResend(false);
      } else {
        setErrorMessage(data?.message || 'Failed to resend OTP code.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#050814', '#0A1228', '#02040A']}
      locations={[0, 0.55, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ambient background glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Back to Login Button */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>

              {/* Dynamic Header */}
              <Animated.View
                style={[
                  styles.headerContainer,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <Text style={styles.welcomeText}>
                  {currentStep === 'EMAIL' && 'Reset Password 🔒'}
                  {currentStep === 'OTP' && 'Verify OTP 💬'}
                  {currentStep === 'NEW_PASSWORD' && 'New Password 🔑'}
                </Text>
                <Text style={styles.subText}>
                  {currentStep === 'EMAIL' &&
                    "Enter your email address and we'll send you an OTP code."}
                  {currentStep === 'OTP' &&
                    `Enter the verification code sent to ${email}`}
                  {currentStep === 'NEW_PASSWORD' &&
                    'Set a strong new password to protect your account.'}
                </Text>
              </Animated.View>

              {/* Global Error Banner */}
              {!!errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Form Content Steps */}
              <Animated.View
                style={[
                  styles.formContainer,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                {/* STEP 1: EMAIL ADDRESS */}
                {currentStep === 'EMAIL' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          emailFocused && styles.inputFocused,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="name@example.com"
                          placeholderTextColor="rgba(255, 255, 255, 0.35)"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errorMessage) setErrorMessage('');
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          editable={!loading}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#040914" />
                      ) : (
                        <Text style={styles.actionButtonText}>GENERATE OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2: OTP VERIFICATION */}
                {currentStep === 'OTP' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>ENTER OTP CODE</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          otpFocused && styles.inputFocused,
                        ]}
                      >
                        <TextInput
                          style={[styles.textInput, styles.otpInput]}
                          placeholder="• • • • • •"
                          placeholderTextColor="rgba(255, 255, 255, 0.35)"
                          value={otp}
                          onChangeText={(text) => {
                            setOtp(text);
                            if (errorMessage) setErrorMessage('');
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                          onFocus={() => setOtpFocused(true)}
                          onBlur={() => setOtpFocused(false)}
                          editable={!loading}
                        />
                      </View>
                    </View>

                    {/* Resend Timer */}
                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>Didn't receive the code? </Text>
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={!canResend || loading}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.resendLink,
                            (!canResend || loading) && styles.disabledLink,
                          ]}
                        >
                          {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                      onPress={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#040914" />
                      ) : (
                        <Text style={styles.actionButtonText}>VERIFY OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {currentStep === 'NEW_PASSWORD' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          passFocused && styles.inputFocused,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="Minimum 8 characters"
                          placeholderTextColor="rgba(255, 255, 255, 0.35)"
                          secureTextEntry={!isPasswordVisible}
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text);
                            if (errorMessage) setErrorMessage('');
                          }}
                          onFocus={() => setPassFocused(true)}
                          onBlur={() => setPassFocused(false)}
                          editable={!loading}
                        />
                        <TouchableOpacity
                          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                          style={styles.eyeButton}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.eyeButtonText}>
                            {isPasswordVisible ? 'HIDE' : 'SHOW'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          confirmFocused && styles.inputFocused,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="Re-enter password"
                          placeholderTextColor="rgba(255, 255, 255, 0.35)"
                          secureTextEntry={!isPasswordVisible}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (errorMessage) setErrorMessage('');
                          }}
                          onFocus={() => setConfirmFocused(true)}
                          onBlur={() => setConfirmFocused(false)}
                          editable={!loading}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                      onPress={handleUpdatePassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#040914" />
                      ) : (
                        <Text style={styles.actionButtonText}>UPDATE PASSWORD</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scaleWidth(24),
    justifyContent: 'center',
    paddingVertical: scaleHeight(20),
  },
  ambientGlow: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    width: scaleWidth(280),
    height: scaleWidth(280),
    borderRadius: 1000,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },

  // Navigation
  backButton: {
    marginBottom: scaleHeight(24),
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#00E676',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  // Header
  headerContainer: {
    marginBottom: scaleHeight(20),
  },
  welcomeText: {
    fontSize: moderateScale(isTablet ? 38 : 28),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: scaleHeight(8),
  },
  subText: {
    fontSize: moderateScale(isTablet ? 18 : 15),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: moderateScale(22),
  },

  // Errors
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: 'rgba(255, 82, 82, 0.4)',
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  errorText: {
    color: '#FF5252',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Form Fields
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: scaleHeight(20),
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: scaleHeight(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: scaleWidth(16),
    height: scaleHeight(54),
  },
  inputFocused: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.04)',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '500',
  },
  otpInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  eyeButton: {
    paddingLeft: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  eyeButtonText: {
    color: '#00E676',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Resend Timer
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(13),
  },
  resendLink: {
    color: '#00E676',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  disabledLink: {
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Actions
  actionButton: {
    width: '100%',
    backgroundColor: '#00E676',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginTop: scaleHeight(8),
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#040914',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default ForgotPasswordScreen;