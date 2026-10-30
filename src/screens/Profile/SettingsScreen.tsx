// src/screens/Settings/SettingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
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
import { AppModal, ModalType } from '../../components/AppModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type ToggleField = 'sound' | 'vacation';

interface UserSettings {
  soundOn?: boolean;
  vacationModeOn?: boolean;
}

interface UserData {
  settings?: UserSettings;
  soundOn?: boolean;
  vacationModeOn?: boolean;
  [key: string]: unknown;
}

// App Details & External URLs
const PRIVACY_POLICY_URL = 'https://kegistech.com/habitly-privacy-policy.html';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kegistech.habitly';
const APP_STORE_URL = 'https://apps.apple.com/in/app/consistent-habit-tracker/id6804195230';

// Color Palette Constants
const COLORS = {
  background: '#161820',
  cardBackground: '#1E222D',
  primary: '#2558D8',
  white: '#FFFFFF',
  subtext: '#8E93A6',
  trackFalse: '#2C303E',
  border: 'rgba(255, 255, 255, 0.05)',
  icons: {
    sound: '#29B6F6',
    vacation: '#FFC107',
    password: '#4CAF50',
    help: '#AB47BC',
    privacy: '#FFB300',
    rate: '#FF7043',
    share: '#26A69A',
  },
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  // State Management
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vacationMode, setVacationMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingField, setUpdatingField] = useState<ToggleField | null>(null);

  const [modalConfig, setModalConfig] = useState<{
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
}>({
  visible: false,
  type: 'success',
  title: '',
  message: '',
});

// Helper function to easily trigger the modal from anywhere in the component
const showAppModal = (
  type: ModalType,
  title: string,
  message: string,
  onConfirm?: () => void
) => {
  setModalConfig({
    visible: true,
    type,
    title,
    message,
    onConfirm,
  });
};

  // 1. Hydrate Initial Values from Local Cache
  useEffect(() => {
    let isMounted = true;

    const loadSettingsFromStorage = async (): Promise<void> => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData && isMounted) {
          const parsedData: UserData = JSON.parse(storedUserData);
          
          if (typeof parsedData.soundOn === 'boolean') {
            setSoundEnabled(parsedData.soundOn);
          }
          if (typeof parsedData.vacationModeOn === 'boolean') {
            setVacationMode(parsedData.vacationModeOn);
          }
        }
      } catch (error) {
        console.error('[SettingsScreen] Failed to load local settings:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettingsFromStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Helper: Sync Local AsyncStorage Cache
  const updateLocalSettingsCache = async (
    soundVal: boolean,
    vacationVal: boolean
  ): Promise<void> => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedData: UserData = JSON.parse(storedUserData);
        const updatedData: UserData = {
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
      console.error('[SettingsScreen] Failed to update local settings cache:', error);
    }
  };

  // 3. API Handler: Optimistic Settings Toggle
  const handleToggleSetting = async (field: ToggleField, newValue: boolean): Promise<void> => {
    const nextSound = field === 'sound' ? newValue : soundEnabled;
    const nextVacation = field === 'vacation' ? newValue : vacationMode;

    // Optimistic UI updates
    if (field === 'sound') setSoundEnabled(newValue);
    if (field === 'vacation') setVacationMode(newValue);

    setUpdatingField(field);

    const payload = {
      soundOn: nextSound,
      vacationModeOn: nextVacation,
    };

    try {
      await putApi(
        settingUserAPI,
        payload,
        async () => {
          setUpdatingField(null);
          await updateLocalSettingsCache(nextSound, nextVacation);
        },
        (err: { message?: string }) => {
          setUpdatingField(null);
          // Revert toggle state on failure
          if (field === 'sound') setSoundEnabled(!newValue);
          if (field === 'vacation') setVacationMode(!newValue);

           showAppModal(
  'error',
 t('common.error'), 
 err?.message || t('settings.errors.failedUpdate')
);
        }
      );
    } catch (error) {
      setUpdatingField(null);
      if (field === 'sound') setSoundEnabled(!newValue);
      if (field === 'vacation') setVacationMode(!newValue);
        showAppModal(
  'error',
t('common.error'),
 t('settings.errors.unexpectedNetwork')
);
    }
  };

  // 4. Link Handler Helper
  const openExternalUrl = useCallback(async (url: string, errorMessage: string): Promise<void> => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAppModal(
  'error',
t('common.error'), 
errorMessage
);
      }
    } catch (error) {

       showAppModal(
  'error',
t('common.error'), 
t('settings.errors.genericLink')
);
    }
  }, [t]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    openExternalUrl(PRIVACY_POLICY_URL, t('settings.errors.privacyPolicy'));
  }, [openExternalUrl, t]);

  const handleRateUs = useCallback(() => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    openExternalUrl(storeUrl, t('settings.errors.appStore'));
  }, [openExternalUrl, t]);

  // 5. WhatsApp Sharing Handler
  const handleShareAppWhatsApp = useCallback(async (): Promise<void> => {
    const shareMessage = t('settings.shareMessage', {
      playStoreUrl: PLAY_STORE_URL,
      appStoreUrl: APP_STORE_URL,
    });
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
       showAppModal(
  'error',
t('common.error'),
 t('settings.errors.whatsapp')
);
    }
  }, [t]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack')}
        >
          <ArrowLeft size={moderateScale(22)} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('settings.headerTitle')}</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GENERAL SECTION */}
          <Text style={styles.sectionTitle}>{t('settings.generalTitle')}</Text>
          <View style={styles.sectionContainer}>
            
            {/* Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.leftRow}>
                <Volume2 size={moderateScale(22)} color={COLORS.icons.sound} />
                <Text style={styles.settingTitle}>{t('settings.sound')}</Text>
              </View>
              {updatingField === 'sound' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Switch
                  trackColor={{ false: COLORS.trackFalse, true: COLORS.primary }}
                  thumbColor={soundEnabled ? COLORS.white : COLORS.subtext}
                  ios_backgroundColor={COLORS.trackFalse}
                  onValueChange={(val) => handleToggleSetting('sound', val)}
                  value={soundEnabled}
                />
              )}
            </View>

            {/* Vacation Mode Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.leftRow}>
                <Umbrella size={moderateScale(22)} color={COLORS.icons.vacation} />
                <View style={styles.flexShrink}>
                  <Text style={styles.settingTitle}>{t('settings.vacationMode')}</Text>
                  <Text style={styles.settingSubtitle}>
                    {t('settings.vacationSubtitle')}
                  </Text>
                </View>
              </View>
              {updatingField === 'vacation' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Switch
                  trackColor={{ false: COLORS.trackFalse, true: COLORS.primary }}
                  thumbColor={vacationMode ? COLORS.white : COLORS.subtext}
                  ios_backgroundColor={COLORS.trackFalse}
                  onValueChange={(val) => handleToggleSetting('vacation', val)}
                  value={vacationMode}
                />
              )}
            </View>

            {/* Change Password */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={styles.leftRow}>
                <Lock size={moderateScale(22)} color={COLORS.icons.password} />
                <Text style={styles.settingTitle}>{t('settings.changePassword')}</Text>
              </View>
            </TouchableOpacity>

            {/* Help */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={styles.leftRow}>
                <HelpCircle size={moderateScale(22)} color={COLORS.icons.help} />
                <Text style={styles.settingTitle}>{t('settings.help')}</Text>
              </View>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={handleOpenPrivacyPolicy}
            >
              <View style={styles.leftRow}>
                <Info size={moderateScale(22)} color={COLORS.icons.privacy} />
                <Text style={styles.settingTitle}>{t('settings.privacyPolicy')}</Text>
              </View>
            </TouchableOpacity>

            {/* Rate Us */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingRow}
              onPress={handleRateUs}
            >
              <View style={styles.leftRow}>
                <ThumbsUp size={moderateScale(22)} color={COLORS.icons.rate} />
                <Text style={styles.settingTitle}>{t('settings.rateUs')}</Text>
              </View>
            </TouchableOpacity>

            {/* Share App via WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.settingRow, styles.noBorder]}
              onPress={handleShareAppWhatsApp}
            >
              <View style={styles.leftRow}>
                <Share2 size={moderateScale(22)} color={COLORS.icons.share} />
                <Text style={styles.settingTitle}>{t('settings.shareApp')}</Text>
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: COLORS.white,
  },
  headerRightPlaceholder: {
    width: scaleWidth(40),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(40),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: COLORS.subtext,
    letterSpacing: 0.8,
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(10),
    paddingLeft: scaleWidth(4),
  },
  sectionContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: moderateScale(20),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.white,
  },
  settingSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: COLORS.subtext,
    marginTop: scaleHeight(2),
  },
});

export default SettingsScreen;