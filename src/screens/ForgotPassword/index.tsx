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
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';
import { postApi } from '../../services/commonAPIs';
import {
  forgotPasswordAPI,
  verifyForgotPasswordOtpAPI,
  resetPasswordAPI,
} from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD';

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  // --- Flow State ---
  const [currentStep, setCurrentStep] = useState<Step>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Field Errors
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Focus States
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Resend Timer State
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // --- Animation Setup ---
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStepTransition = (nextStep: Step) => {
    setGeneralError('');

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(15);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Handle Back Button
  const handleBackPress = () => {
    if (currentStep === 'OTP') {
      animateStepTransition('EMAIL');
    } else if (currentStep === 'NEW_PASSWORD') {
      animateStepTransition('OTP');
    } else {
      navigation.goBack();
    }
  };

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (currentStep === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);

  // --- Step Validations ---
  const validateEmailStep = (): boolean => {
    setEmailError('');
    setGeneralError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailError(t('forgotPassword.errors.emailRequired'));
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError(t('forgotPassword.errors.invalidEmail'));
      return false;
    }
    return true;
  };

  const validateOtpStep = (): boolean => {
    setOtpError('');
    setGeneralError('');
    if (!otp.trim()) {
      setOtpError(t('forgotPassword.errors.otpRequired'));
      return false;
    }
    if (otp.trim().length < 4) {
      setOtpError(t('forgotPassword.errors.invalidOtp'));
      return false;
    }
    return true;
  };

  const validatePasswordStep = (): boolean => {
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    let isValid = true;

    if (!newPassword) {
      setPasswordError(t('forgotPassword.errors.passwordRequired'));
      isValid = false;
    } else if (newPassword.length < 8) {
      setPasswordError(t('forgotPassword.errors.passwordLength'));
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('forgotPassword.errors.confirmPasswordRequired'));
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('forgotPassword.errors.passwordsMismatch'));
      isValid = false;
    }

    return isValid;
  };

  // --- API Handlers ---

  // STEP 1: Request OTP
  const handleSendOtp = () => {
    if (!validateEmailStep()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    const payload = { email: email.trim() };

    postApi(
      forgotPasswordAPI,
      payload,
      (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200 || response.success)) {
          setTimer(30);
          setCanResend(false);
          animateStepTransition('OTP');
        } else {
          setGeneralError(response?.message || t('forgotPassword.errors.sendOtpFailed'));
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg = error?.response?.data?.message || error?.message || t('forgotPassword.errors.networkError');
        setGeneralError(serverMsg);
      }
    );
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = () => {
    if (!validateOtpStep()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    const payload = {
      email: email.trim(),
      otp: otp.trim(),
    };

    postApi(
      verifyForgotPasswordOtpAPI,
      payload,
      (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200 || response.success)) {
          animateStepTransition('NEW_PASSWORD');
        } else {
          setGeneralError(response?.message || t('forgotPassword.errors.invalidOtp'));
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg = error?.response?.data?.message || error?.message || t('forgotPassword.errors.invalidOtp');
        setGeneralError(serverMsg);
      }
    );
  };

  // STEP 3: Reset Password
  const handleUpdatePassword = () => {
    if (!validatePasswordStep()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    const payload = {
      email: email.trim(),
      otp: otp.trim(),
      newPassword: newPassword,
    };

    postApi(
      resetPasswordAPI,
      payload,
      (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200 || response.success)) {
          Alert.alert(
            t('forgotPassword.success'),
            t('forgotPassword.successMsg'),
            [{ text: t('forgotPassword.loginNow'), onPress: () => navigation.navigate('Login') }]
          );
        } else {
          setGeneralError(response?.message || t('forgotPassword.errors.updatePasswordFailed'));
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg = error?.response?.data?.message || error?.message || t('forgotPassword.errors.updatePasswordFailed');
        setGeneralError(serverMsg);
      }
    );
  };

  // Resend OTP Helper
  const handleResendOtp = () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    setGeneralError('');

    postApi(
      forgotPasswordAPI,
      { email: email.trim() },
      (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200 || response.success)) {
          setTimer(30);
          setCanResend(false);
        } else {
          setGeneralError(response?.message || t('forgotPassword.errors.resendFailed'));
        }
      },
      (error: any) => {
        setIsLoading(false);
        setGeneralError(error?.response?.data?.message || error?.message || t('forgotPassword.errors.resendFailed'));
      }
    );
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#312E81']}
      locations={[0, 0.5, 1]}
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
              {/* Back Action Header */}
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>
                  {currentStep === 'EMAIL'
                    ? `← ${t('forgotPassword.backToLogin')}`
                    : `← ${t('forgotPassword.back')}`}
                </Text>
              </TouchableOpacity>

              {/* Header Info */}
              <Animated.View
                style={[
                  styles.headerContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{t('forgotPassword.tag')}</Text>
                </View>

                <Text style={styles.welcomeText}>
                  {currentStep === 'EMAIL' && t('forgotPassword.titleEmail')}
                  {currentStep === 'OTP' && t('forgotPassword.titleOtp')}
                  {currentStep === 'NEW_PASSWORD' && t('forgotPassword.titlePassword')}
                </Text>
                <Text style={styles.subText}>
                  {currentStep === 'EMAIL' && t('forgotPassword.subEmail')}
                  {currentStep === 'OTP' && `${t('forgotPassword.subOtp')} ${email}`}
                  {currentStep === 'NEW_PASSWORD' && t('forgotPassword.subPassword')}
                </Text>
              </Animated.View>

              {/* General Error Banner */}
              {generalError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              ) : null}

              {/* Form Section */}
              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* STEP 1: EMAIL */}
                {currentStep === 'EMAIL' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>{t('forgotPassword.labels.email')}</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          emailFocused && styles.inputFocused,
                          !!emailError && styles.inputErrorBorder,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('forgotPassword.placeholders.email')}
                          placeholderTextColor="rgba(226, 232, 240, 0.35)"
                          value={email}
                          onChangeText={(val) => {
                            setEmail(val);
                            if (emailError) setEmailError('');
                            if (generalError) setGeneralError('');
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          editable={!isLoading}
                        />
                      </View>
                      {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.actionButton}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.actionButtonText}>
                            {t('forgotPassword.buttons.generateOtp')}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2: OTP */}
                {currentStep === 'OTP' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>{t('forgotPassword.labels.otp')}</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          otpFocused && styles.inputFocused,
                          !!otpError && styles.inputErrorBorder,
                        ]}
                      >
                        <TextInput
                          style={[styles.textInput, styles.otpInput]}
                          placeholder={t('forgotPassword.placeholders.otp')}
                          placeholderTextColor="rgba(226, 232, 240, 0.35)"
                          value={otp}
                          onChangeText={(val) => {
                            setOtp(val);
                            if (otpError) setOtpError('');
                            if (generalError) setGeneralError('');
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                          onFocus={() => setOtpFocused(true)}
                          onBlur={() => setOtpFocused(false)}
                          editable={!isLoading}
                        />
                      </View>
                      {otpError ? <Text style={styles.fieldErrorText}>{otpError}</Text> : null}
                    </View>

                    {/* Resend Timer */}
                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>
                        {t('forgotPassword.noOtp')}{' '}
                      </Text>
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={!canResend || isLoading}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.resendLink, (!canResend || isLoading) && styles.disabledLink]}>
                          {canResend
                            ? t('forgotPassword.buttons.resend')
                            : `${t('forgotPassword.buttons.resendIn')} ${timer}s`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.actionButton}
                      onPress={handleVerifyOtp}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.actionButtonText}>
                            {t('forgotPassword.buttons.verifyOtp')}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {currentStep === 'NEW_PASSWORD' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>
                        {t('forgotPassword.labels.newPassword')}
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          passFocused && styles.inputFocused,
                          !!passwordError && styles.inputErrorBorder,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('forgotPassword.placeholders.minPassword')}
                          placeholderTextColor="rgba(226, 232, 240, 0.35)"
                          secureTextEntry={!isPasswordVisible}
                          value={newPassword}
                          onChangeText={(val) => {
                            setNewPassword(val);
                            if (passwordError) setPasswordError('');
                            if (generalError) setGeneralError('');
                          }}
                          onFocus={() => setPassFocused(true)}
                          onBlur={() => setPassFocused(false)}
                          editable={!isLoading}
                        />
                        <TouchableOpacity
                          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                          style={styles.eyeButton}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.eyeButtonText}>
                            {isPasswordVisible
                              ? t('forgotPassword.hide')
                              : t('forgotPassword.show')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
                    </View>

                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>
                        {t('forgotPassword.labels.confirmPassword')}
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          confirmFocused && styles.inputFocused,
                          !!confirmPasswordError && styles.inputErrorBorder,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('forgotPassword.placeholders.reEnterPassword')}
                          placeholderTextColor="rgba(226, 232, 240, 0.35)"
                          secureTextEntry={!isPasswordVisible}
                          value={confirmPassword}
                          onChangeText={(val) => {
                            setConfirmPassword(val);
                            if (confirmPasswordError) setConfirmPasswordError('');
                            if (generalError) setGeneralError('');
                          }}
                          onFocus={() => setConfirmFocused(true)}
                          onBlur={() => setConfirmFocused(false)}
                          editable={!isLoading}
                        />
                      </View>
                      {confirmPasswordError ? (
                        <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.actionButton}
                      onPress={handleUpdatePassword}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.actionButtonText}>
                            {t('forgotPassword.buttons.updatePassword')}
                          </Text>
                        )}
                      </LinearGradient>
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 70,
    elevation: 20,
  },

  // Back Link
  backButton: {
    marginBottom: scaleHeight(20),
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#34D399',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  // Header
  headerContainer: {
    marginBottom: scaleHeight(28),
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: scaleHeight(14),
  },
  tagBadgeText: {
    color: '#34D399',
    fontSize: moderateScale(11),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  welcomeText: {
    fontSize: moderateScale(isTablet ? 38 : 30),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: scaleHeight(8),
  },
  subText: {
    fontSize: moderateScale(isTablet ? 18 : 15),
    color: 'rgba(226, 232, 240, 0.75)',
    lineHeight: moderateScale(22),
  },

  // Banner Error
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(20),
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Form
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: scaleHeight(18),
  },
  inputLabel: {
    color: 'rgba(226, 232, 240, 0.65)',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: scaleHeight(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: scaleWidth(16),
    height: scaleHeight(54),
  },
  inputFocused: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
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
    color: '#34D399',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1,
  },
  fieldErrorText: {
    color: '#F87171',
    fontSize: moderateScale(12),
    marginTop: scaleHeight(6),
    fontWeight: '500',
  },

  // Resend Timer
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
  },
  resendText: {
    color: 'rgba(226, 232, 240, 0.65)',
    fontSize: moderateScale(13),
  },
  resendLink: {
    color: '#34D399',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  disabledLink: {
    color: 'rgba(226, 232, 240, 0.35)',
  },

  // Actions
  actionButton: {
    width: '100%',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(12),
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default ForgotPasswordScreen;