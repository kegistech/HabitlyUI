import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_KEY } from '../localization/i18n';
import { putApi } from '../services/commonAPIs';
import { updateLanguageAPI } from '../services/apiendpoints';

export const changeAppLanguage = async (
  newLanguageCode: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
) => {
  try {
    // 1. Update UI language state in i18next
    await i18n.changeLanguage(newLanguageCode);

    // 2. Persist in AsyncStorage under key 'languageCode'
    await AsyncStorage.setItem(LANGUAGE_KEY, newLanguageCode);

    // 3. Sync languageCode to Database via API
    const payload = { languageCode: newLanguageCode };

    putApi(
      updateLanguageAPI,
      payload,
      (response: any) => {
        if (response && (response.succeeded || response.isSuccess || response.status === 200)) {
          if (onSuccess) onSuccess();
        } else {
          if (onError) onError(response?.message || 'Database sync failed.');
        }
      },
      (error: any) => {
        // App language remains updated locally even if network fails
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error('Failed to switch language:', error);
    if (onError) onError(error);
  }
};