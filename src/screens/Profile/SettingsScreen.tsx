// src/screens/Settings/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Volume2,
  Umbrella,
  HelpCircle,
  Info,
  ThumbsUp,
  Share2,
  Lock,
} from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { putApi } from '../../services/commonAPIs'; 
import { settingUserAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// App Details & URLs
const PRIVACY_POLICY_URL = 'https://kegistech.com/habitly-privacy-policy.html';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kegistech.habitly';
const APP_STORE_URL = 'https://apps.apple.com/in/app/consistent-habit-tracker/id6804195230'; 

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  // Settings States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vacationMode, setVacationMode] = useState<boolean>(false);

  // Loaders & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingField, setUpdatingField] = useState<'sound' | 'vacation' | null>(null);

  // 1. On Mount: Hydrate initial values from AsyncStorage
  useEffect(() => {
    const loadSettingsFromStorage = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const settings = JSON.parse(storedUserData);
          
          if (settings.soundOn !== undefined) {
            setSoundEnabled(Boolean(settings.soundOn));
          }
          if (settings.vacationModeOn !== undefined) {
            setVacationMode(Boolean(settings.vacationModeOn));
          }
        }
      } catch (error) {
        console.error('Failed to load local settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettingsFromStorage();
  }, []);

  // 2. Helper to update AsyncStorage cache
  const updateLocalSettingsCache = async (soundVal: boolean, vacationVal: boolean) => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const updatedData = {
          ...parsedData,
          settings: {
            ...parsedData.settings,
            soundOn: soundVal,
            vacationModeOn: vacationVal,
          },
          soundOn: soundVal,
          vacationModeOn: vacationVal,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Failed to update local settings cache:', error);
    }
  };

  // 3. API Call: Update Settings On Switch Toggle
  const handleToggleSetting = async (field: 'sound' | 'vacation', newValue: boolean) => {
    const nextSound = field === 'sound' ? newValue : soundEnabled;
    const nextVacation = field === 'vacation' ? newValue : vacationMode;

    // Optimistic state update
    if (field === 'sound') setSoundEnabled(newValue);
    if (field === 'vacation') setVacationMode(newValue);

    setUpdatingField(field);

    const payload = {
      soundOn: nextSound,
      vacationModeOn: nextVacation,
    };

    await putApi(
      settingUserAPI,
      payload,
      async (res: any) => {
        setUpdatingField(null);
        await updateLocalSettingsCache(nextSound, nextVacation);
      },
      (err: any) => {
        setUpdatingField(null);
        // Revert toggle state on error
        if (field === 'sound') setSoundEnabled(!newValue);
        if (field === 'vacation') setVacationMode(!newValue);
        Alert.alert('Error', err?.message || 'Failed to update settings. Please try again.');
      }
    );
  };

  // 4. Open Privacy & Policy Web Link
  const handleOpenPrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(PRIVACY_POLICY_URL);
      if (supported) {
        await Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        Alert.alert('Error', 'Unable to open privacy policy web page.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while opening the web link.');
    }
  };

  // 5. Open Store Listing for Rating
  const handleRateUs = async () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        Alert.alert('Error', 'Unable to open app store page.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while opening the store.');
    }
  };

  // 6. Share via WhatsApp with Play Store and App Store Links
  const handleShareAppWhatsApp = async () => {
    const shareMessage = `Check out Habitly! It helps you track your daily habits and achieve your goals.\n\n📱 Download for Android: ${PLAY_STORE_URL}\n🍏 Download for iOS: ${APP_STORE_URL}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp URL if app isn't directly handling deep link
        const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'WhatsApp is not installed or available on this device.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2558D8" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GENERAL SECTION */}
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.sectionContainer}>
            {/* Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.leftRow}>
                <Volume2 size={moderateScale(22)} color="#29B6F6" />
                <Text style={styles.settingTitle}>Sound</Text>
              </View>
              {updatingField === 'sound' ? (
                <ActivityIndicator size="small" color="#2558D8" />
              ) : (
                <Switch
                  trackColor={{ false: '#2C303E', true: '#2558D8' }}
                  thumbColor={soundEnabled ? '#FFFFFF' : '#8E93A6'}
                  ios_backgroundColor="#2C303E"
                  onValueChange={(val) => handleToggleSetting('sound', val)}
                  value={soundEnabled}
                />
              )}
            </View>

            {/* Vacation Mode Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.leftRow}>
                <Umbrella size={moderateScale(22)} color="#FFC107" />
                <View style={styles.flexShrink}>
                  <Text style={styles.settingTitle}>Vacation mode</Text>
                  <Text style={styles.settingSubtitle}>
                    Put habits on pause, and keep your stats
                  </Text>
                </View>
              </View>
              {updatingField === 'vacation' ? (
                <ActivityIndicator size="small" color="#2558D8" />
              ) : (
                <Switch
                  trackColor={{ false: '#2C303E', true: '#2558D8' }}
                  thumbColor={vacationMode ? '#FFFFFF' : '#8E93A6'}
                  ios_backgroundColor="#2C303E"
                  onValueChange={(val) => handleToggleSetting('vacation', val)}
                  value={vacationMode}
                />
              )}
            </View>

            {/* Change Password */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={() => navigation.navigate('ChangePassword' as never)}
            >
              <View style={styles.leftRow}>
                <Lock size={moderateScale(22)} color="#4CAF50" />
                <Text style={styles.settingTitle}>Change Password</Text>
              </View>
            </TouchableOpacity>

            {/* Help */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={() => navigation.navigate('Help' as never)}
            >
              <View style={styles.leftRow}>
                <HelpCircle size={moderateScale(22)} color="#AB47BC" />
                <Text style={styles.settingTitle}>Help</Text>
              </View>
            </TouchableOpacity>

            {/* Privacy & Policy */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={handleOpenPrivacyPolicy}
            >
              <View style={styles.leftRow}>
                <Info size={moderateScale(22)} color="#FFB300" />
                <Text style={styles.settingTitle}>Privacy & Policy</Text>
              </View>
            </TouchableOpacity>

            {/* Rate Us */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={handleRateUs}
            >
              <View style={styles.leftRow}>
                <ThumbsUp size={moderateScale(22)} color="#FF7043" />
                <Text style={styles.settingTitle}>Rate us</Text>
              </View>
            </TouchableOpacity>

            {/* Share App via WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.settingRow, styles.noBorder]}
              onPress={handleShareAppWhatsApp}
            >
              <View style={styles.leftRow}>
                <Share2 size={moderateScale(22)} color="#26A69A" />
                <Text style={styles.settingTitle}>Share app</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161820',
  },

  /* Header Bar */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#1E222D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: scaleWidth(40),
  },

  /* Loader */
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(40),
  },

  /* Section Titles */
  sectionTitle: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#8E93A6',
    letterSpacing: 0.8,
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(10),
    paddingLeft: scaleWidth(4),
  },

  /* Card Group Container */
  sectionContainer: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  /* Row Item */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(16),
    flex: 1,
    paddingRight: scaleWidth(10),
  },
  flexShrink: {
    flex: 1,
  },
  settingTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#8E93A6',
    marginTop: scaleHeight(2),
  },
});

export default SettingsScreen;