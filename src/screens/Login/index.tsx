// src/screens/Login/index.tsx
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';
import { postApi, setAuthToken } from '../../services/commonAPIs';
import { loginAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  // --- Form State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // --- API & Validation States ---
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // --- Entrance Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Input Validations ---
  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  // --- API Call Handler ---
  const handleLogin = () => {
    if (!validateForm()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    const payload = {
      email: email.trim(),
      password: password,
    };

    postApi(
      loginAPI,
      payload,
      async (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200 || response.token)) {
          const token = response.token || response.data?.token;
          if (token) {
            await setAuthToken(token);
            await AsyncStorage.setItem('userToken', token);
          }
          if (response.data?.userDetail) {
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.userDetail));
          }
              if (response.data?.userDetail?.id) {
                          await AsyncStorage.setItem('id', String(response.data.userDetail?.id));
              }

          navigation.replace('Dashboard');
        } else {
          setGeneralError(response?.message || 'Login failed. Please verify your credentials.');
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg = error?.response?.data?.message || error?.message || 'Invalid email or password. Please try again.';
        setGeneralError(serverMsg);
      }
    );
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUpRedirect = () => {
    navigation.replace('SignUp');
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
                  <Text style={styles.tagBadgeText}>WELCOME BACK</Text>
                </View>

                <Text style={styles.welcomeText}>Sign In 👋</Text>
                <Text style={styles.subText}>
                  Continue your streak and track today's progress.
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
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      emailFocused && styles.inputFocused,
                      !!emailError && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
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
                    />
                  </View>
                  {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      passwordFocused && styles.inputFocused,
                      !!passwordError && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(226, 232, 240, 0.35)"
                      secureTextEntry={!isPasswordVisible}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (passwordError) setPasswordError('');
                        if (generalError) setGeneralError('');
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
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
                  {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.loginButton}
                  onPress={handleLogin}
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
                      <Text style={styles.loginButtonText}>SIGN IN</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer Switcher */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={handleSignUpRedirect} activeOpacity={0.7}>
                    <Text style={styles.signUpText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
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

  // Actions
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: scaleHeight(24),
  },
  forgotPasswordText: {
    color: '#34D399',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  loginButton: {
    width: '100%',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: scaleHeight(24),
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  // Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(226, 232, 240, 0.65)',
    fontSize: moderateScale(14),
  },
  signUpText: {
    color: '#34D399',
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
});

export default LoginScreen;