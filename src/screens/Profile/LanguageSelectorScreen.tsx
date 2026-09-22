// src/screens/Settings/LanguageSelectorScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { changeAppLanguage } from '../../localization/languageService';
import { LANGUAGE_KEY } from '../../localization/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelector'>;

interface LanguageOption {
  code: string;
  titleKey: string;
  nativeTitleKey: string;
  descriptionKey: string;
}

const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    titleKey: 'languageSelector.languages.en.title',
    nativeTitleKey: 'languageSelector.languages.en.nativeTitle',
    descriptionKey: 'languageSelector.languages.en.description',
  },
  {
    code: 'ja',
    titleKey: 'languageSelector.languages.ja.title',
    nativeTitleKey: 'languageSelector.languages.ja.nativeTitle',
    descriptionKey: 'languageSelector.languages.ja.description',
  },
  {
    code: 'de',
    titleKey: 'languageSelector.languages.de.title',
    nativeTitleKey: 'languageSelector.languages.de.nativeTitle',
    descriptionKey: 'languageSelector.languages.de.description',
  },
  {
    code: 'fr',
    titleKey: 'languageSelector.languages.fr.title',
    nativeTitleKey: 'languageSelector.languages.fr.nativeTitle',
    descriptionKey: 'languageSelector.languages.fr.description',
  },
  {
    code: 'ko',
    titleKey: 'languageSelector.languages.ko.title',
    nativeTitleKey: 'languageSelector.languages.ko.nativeTitle',
    descriptionKey: 'languageSelector.languages.ko.description',
  },
  {
    code: 'es',
    titleKey: 'languageSelector.languages.es.title',
    nativeTitleKey: 'languageSelector.languages.es.nativeTitle',
    descriptionKey: 'languageSelector.languages.es.description',
  },
  {
    code: 'da',
    titleKey: 'languageSelector.languages.da.title',
    nativeTitleKey: 'languageSelector.languages.da.nativeTitle',
    descriptionKey: 'languageSelector.languages.da.description',
  },
  {
    code: 'nb',
    titleKey: 'languageSelector.languages.nb.title',
    nativeTitleKey: 'languageSelector.languages.nb.nativeTitle',
    descriptionKey: 'languageSelector.languages.nb.description',
  },
  {
    code: 'sv',
    titleKey: 'languageSelector.languages.sv.title',
    nativeTitleKey: 'languageSelector.languages.sv.nativeTitle',
    descriptionKey: 'languageSelector.languages.sv.description',
  },
  {
    code: 'it',
    titleKey: 'languageSelector.languages.it.title',
    nativeTitleKey: 'languageSelector.languages.it.nativeTitle',
    descriptionKey: 'languageSelector.languages.it.description',
  },
  {
    code: 'zh-zhTW',
    titleKey: 'languageSelector.languages.zh-Hans.title',
    nativeTitleKey: 'languageSelector.languages.zh-Hans.nativeTitle',
    descriptionKey: 'languageSelector.languages.zh-Hans.description',
  },
  {
    code: 'zh-Hant',
    titleKey: 'languageSelector.languages.zh-Hant.title',
    nativeTitleKey: 'languageSelector.languages.zh-Hant.nativeTitle',
    descriptionKey: 'languageSelector.languages.zh-Hant.description',
  },
  {
    code: 'pt',
    titleKey: 'languageSelector.languages.pt.title',
    nativeTitleKey: 'languageSelector.languages.pt.nativeTitle',
    descriptionKey: 'languageSelector.languages.pt.description',
  },
  {
    code: 'ru',
    titleKey: 'languageSelector.languages.ru.title',
    nativeTitleKey: 'languageSelector.languages.ru.nativeTitle',
    descriptionKey: 'languageSelector.languages.ru.description',
  },
  {
    code: 'tr',
    titleKey: 'languageSelector.languages.tr.title',
    nativeTitleKey: 'languageSelector.languages.tr.nativeTitle',
    descriptionKey: 'languageSelector.languages.tr.description',
  },
  {
    code: 'pl',
    titleKey: 'languageSelector.languages.pl.title',
    nativeTitleKey: 'languageSelector.languages.pl.nativeTitle',
    descriptionKey: 'languageSelector.languages.pl.description',
  },
  {
    code: 'th',
    titleKey: 'languageSelector.languages.th.title',
    nativeTitleKey: 'languageSelector.languages.th.nativeTitle',
    descriptionKey: 'languageSelector.languages.th.description',
  },
  {
    code: 'id',
    titleKey: 'languageSelector.languages.id.title',
    nativeTitleKey: 'languageSelector.languages.id.nativeTitle',
    descriptionKey: 'languageSelector.languages.id.description',
  },
  {
    code: 'vi',
    titleKey: 'languageSelector.languages.vi.title',
    nativeTitleKey: 'languageSelector.languages.vi.nativeTitle',
    descriptionKey: 'languageSelector.languages.vi.description',
  },
];

const LanguageSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Load saved language code only ONCE on mount
  useEffect(() => {
    let isMounted = true;

    const loadSavedLanguage = async () => {
      try {
        const cachedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (isMounted) {
          if (cachedLang) {
            setSelectedLanguage(cachedLang);
          } else {
            setSelectedLanguage(i18n.language || 'en');
          }
        }
      } catch (err) {
        console.error('Failed to load language setting:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSavedLanguage();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount to prevent re-triggering loader on i18n.language change

  // Handle language selection and persistence
  const handleSelectLanguage = (item: LanguageOption) => {
    if (selectedLanguage === item.code || updatingCode !== null) return;

    const previousLang = selectedLanguage;
    setSelectedLanguage(item.code);
    setUpdatingCode(item.code);

    changeAppLanguage(
      item.code,
      () => {
        setUpdatingCode(null);
      },
      (error: any) => {
        setUpdatingCode(null);
        setSelectedLanguage(previousLang);
        Alert.alert(
          t('languageSelector.alerts.errorTitle'),
          typeof error === 'string'
            ? error
            : error?.message || t('languageSelector.alerts.genericUpdateError')
        );
      }
    );
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

        <Text style={styles.headerTitle}>{t('languageSelector.screenTitle')}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#29B6F6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.topNoticeText}>{t('languageSelector.topNotice')}</Text>

          {/* Cards List */}
          <View style={styles.cardsContainer}>
            {AVAILABLE_LANGUAGES.map((item) => {
              const isSelected = selectedLanguage === item.code;
              const isPending = updatingCode === item.code;

              return (
                <TouchableOpacity
                  key={item.code}
                  activeOpacity={0.8}
                  style={[styles.card, isSelected && styles.selectedCard]}
                  onPress={() => handleSelectLanguage(item)}
                  disabled={updatingCode !== null}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.titleRow}>
                      <Globe size={moderateScale(18)} color={isSelected ? '#29B6F6' : '#8E93A6'} />
                      <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
                    </View>

                    {isPending ? (
                      <ActivityIndicator size="small" color="#29B6F6" />
                    ) : isSelected ? (
                      <View style={styles.checkBadge}>
                        <Check size={moderateScale(14)} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.cardDescription}>{t(item.descriptionKey)}</Text>

                  {isSelected && (
                    <View style={styles.activeContainer}>
                      <View style={styles.divider} />
                      <View style={styles.activeBadgeRow}>
                        <Text style={styles.activeBadgeText}>
                          {t('languageSelector.activeLanguage')}
                        </Text>
                        <Text style={styles.nativeText}>{t(item.nativeTitleKey)}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.bottomNoticeText}>{t('languageSelector.bottomNotice')}</Text>
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
  topNoticeText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#8E93A6',
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(4),
  },
  bottomNoticeText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#8E93A6',
    marginTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(4),
    lineHeight: moderateScale(18),
  },
  cardsContainer: {
    gap: scaleHeight(14),
  },
  card: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCard: {
    borderColor: '#29B6F6',
    backgroundColor: '#1E2436',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(6),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    flex: 1,
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: scaleWidth(10),
  },
  cardDescription: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: moderateScale(18),
  },
  checkBadge: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#29B6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    marginTop: scaleHeight(12),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: scaleHeight(12),
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#29B6F6',
    letterSpacing: 0.8,
  },
  nativeText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LanguageSelectorScreen;