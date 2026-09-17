// src/screens/SignUp/index.tsx
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
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';
import { getApi, postApi } from '../../services/commonAPIs';
import { accessAPI, countriesAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

interface CountryItem {
  id: number;
  name: string;
  codeOrSubTitle: string;
  extraData: {
    phoneCode: string;
    currency: string;
    latitude: number;
    longitude: number;
  };
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  // --- Form State ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Focus states for input highlight
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Dropdown / Countries State
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    fetchCountries();
  }, []);

  const fetchCountries = () => {
    setLoadingCountries(true);
    getApi(
      countriesAPI,
      (response: any) => {
        setLoadingCountries(false);
        if (response && response.succeeded && response.data) {
          const loadedCountries: CountryItem[] = response.data;
          setCountries(loadedCountries);

          // Default select USA (id: 234)
          const defaultUSA = loadedCountries.find((item) => item.id === 233);
          if (defaultUSA) {
            setSelectedCountry(defaultUSA);
          } else if (loadedCountries.length > 0) {
            setSelectedCountry(loadedCountries[0]);
          }
        }
      },
      (error: any) => {
        setLoadingCountries(false);
        console.warn('Failed to fetch countries', error);
      }
    );
  };

  // --- Handlers ---
  const handleSignUp = async () => {
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password || !selectedCountry) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    let timeZoneId = 'UTC';
    try {
      timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
      console.warn('Could not resolve timezone', e);
    }

    const payload = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      countryId: selectedCountry.id,
      timeZoneId: timeZoneId,
    };

    setIsLoading(true);
    postApi(
      accessAPI,
      payload,
      async (response: any) => {
        setIsLoading(false);
        if (response && response.succeeded) {
          try {
            if (response.data) {
              await AsyncStorage.setItem('userDetail', JSON.stringify(response.data.userDetail));
              if (response.data.token) {
                await AsyncStorage.setItem('Token', response.data.token);
              }
              if (response.data?.userDetail?.id) {
                await AsyncStorage.setItem('id', String(response.data.userDetail?.id));
              }
            }
          } catch (storageErr) {
            console.warn('Error storing signup info', storageErr);
          }
          navigation.replace('WakeUpTime');
        } else {
          setErrorMessage(response?.message || 'Registration failed. Please try again.');
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg = error?.response?.data?.message || error?.message || 'Network error occurred.';
        setErrorMessage(serverMsg);
      }
    );
  };

  const handleSignInRedirect = () => {
    navigation.navigate('Login');
  };



  const openPrivacy = () => {
    Linking.openURL('https://www.kegistech.com/habitly-privacy-policy.html').catch((err) =>
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

      {/* Decorative Ambient Radial Lighting */}
      <View style={styles.ambientLightTop} pointerEvents="none" />
      <View style={styles.ambientLightBottom} pointerEvents="none" />

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
              {/* Header Title */}
              <Animated.View
                style={[
                  styles.headerContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>GET STARTED</Text>
                </View>
                <Text style={styles.welcomeText}>Create Account 🚀</Text>
                <Text style={styles.subText}>
                  Start building better daily routines starting today.
                </Text>
              </Animated.View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Input Card */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Full Name Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      nameFocused && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="John Doe"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Email Address Input */}
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
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      passwordFocused && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      secureTextEntry={!isPasswordVisible}
                      value={password}
                      onChangeText={setPassword}
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
                </View>

                {/* Country Dropdown Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>COUNTRY</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.inputContainer}
                    onPress={() => setIsCountryModalVisible(true)}
                  >
                    <Text
                      style={[
                        styles.textInput,
                        {
                          textAlignVertical: 'center',
                          color: selectedCountry ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                        },
                      ]}
                    >
                      {selectedCountry ? selectedCountry.name : 'Select your country'}
                    </Text>
                    <Text style={styles.dropdownChevron}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Create Account Action Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.signUpButton, isLoading && { opacity: 0.7 }]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.signUpButtonText}>
                      {isLoading ? 'CREATING ACCOUNT...' : 'CREATE MY ACCOUNT'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Legal Footer */}
                <View style={styles.legalFooter}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{' '}
                    <Text style={styles.linkText} onPress={openPrivacy}>
                      Terms and  Privacy Policy
                    </Text>
                  </Text>
                </View>

                {/* Switch to Login Redirect */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={handleSignInRedirect} activeOpacity={0.7}>
                    <Text style={styles.signInText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCountryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalPullHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Country</Text>
                  <TouchableOpacity
                    onPress={() => setIsCountryModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCloseText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {loadingCountries ? (
                  <View style={styles.modalLoadingContainer}>
                    <Text style={{ color: '#FFFFFF', fontSize: moderateScale(14) }}>
                      Loading countries...
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={countries}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                      const isSelected = selectedCountry?.id === item.id;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.countryRow,
                            isSelected && styles.selectedCountryRow,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedCountry(item);
                            setIsCountryModalVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.countryRowText,
                              isSelected && styles.selectedCountryRowText,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {item.codeOrSubTitle ? (
                            <Text style={styles.countrySubText}>{item.codeOrSubTitle}</Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={{ paddingBottom: scaleHeight(24) }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingHorizontal: scaleWidth(20),
    justifyContent: 'center',
    paddingVertical: scaleHeight(24),
  },
  ambientLightTop: {
    position: 'absolute',
    top: -scaleWidth(60),
    right: -scaleWidth(40),
    width: scaleWidth(280),
    height: scaleWidth(280),
    borderRadius: 1000,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  ambientLightBottom: {
    position: 'absolute',
    bottom: -scaleWidth(80),
    left: -scaleWidth(40),
    width: scaleWidth(280),
    height: scaleWidth(280),
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },

  // Header
  headerContainer: {
    marginBottom: scaleHeight(22),
    paddingHorizontal: scaleWidth(4),
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: moderateScale(20),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    marginBottom: scaleHeight(12),
  },
  badgeText: {
    color: '#34D399',
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  welcomeText: {
    fontSize: moderateScale(isTablet ? 38 : 30),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: scaleHeight(6),
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: moderateScale(isTablet ? 18 : 14),
    color: 'rgba(226, 232, 240, 0.75)',
    lineHeight: moderateScale(20),
  },

  // Form Container Card
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: moderateScale(24),
    padding: scaleWidth(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: scaleHeight(12),
    marginBottom: scaleHeight(16),
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Form Fields
  inputWrapper: {
    marginBottom: scaleHeight(16),
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
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: scaleWidth(16),
    height: scaleHeight(52),
  },
  inputFocused: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
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
  dropdownChevron: {
    color: 'rgba(226, 232, 240, 0.5)',
    fontSize: moderateScale(10),
    marginLeft: scaleWidth(8),
  },

  // Action Button
  signUpButton: {
    width: '100%',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
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
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  // Footer & Legal
  legalFooter: {
    marginBottom: scaleHeight(16),
  },
  termsText: {
    color: 'rgba(226, 232, 240, 0.5)',
    fontSize: moderateScale(11),
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  linkText: {
    color: '#34D399',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: moderateScale(14),
  },
  signInText: {
    color: '#34D399',
    fontSize: moderateScale(14),
    fontWeight: '800',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    height: '65%',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(12),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(30) : scaleHeight(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalPullHandle: {
    width: scaleWidth(40),
    height: scaleHeight(4),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: scaleHeight(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  modalCloseText: {
    color: '#34D399',
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  modalLoadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(12),
    borderRadius: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCountryRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  countryRowText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '500',
  },
  selectedCountryRowText: {
    color: '#34D399',
    fontWeight: '800',
  },
  countrySubText: {
    color: 'rgba(226, 232, 240, 0.5)',
    fontSize: moderateScale(13),
  },
});

export default SignUpScreen;