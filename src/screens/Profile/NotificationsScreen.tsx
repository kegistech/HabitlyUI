// src/screens/Notifications/NotificationsScreen.tsx
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowLeft, Clock, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi, putApi } from '../../services/commonAPIs';
import { notificationsUserAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type NotificationKey =
  | 'todays_plan'
  | 'morning_plan'
  | 'afternoon_plan'
  | 'evening_plan'
  | 'today_results';

interface NotificationSetting {
  id: NotificationKey;
  titleKey: string;
  descriptionKey: string;
  isEnabled: boolean;
  time: string; // Display format (e.g., "07:30 am")
}

// Helpers for Time Conversion
const formatTimeForDisplay = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
};

const parseDisplayTimeToDate = (timeStr: string): Date => {
  const d = new Date();
  try {
    const parts = timeStr.trim().split(' ');
    if (parts.length === 2) {
      const [time, period] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (period.toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
    }
  } catch (e) {
    console.error('Error parsing time:', e);
  }
  return d;
};

const convertDisplayToTimeOnly = (timeStr: string): string => {
  const date = parseDisplayTimeToDate(timeStr);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}:00`;
};

const convertTimeOnlyToDisplay = (
  timeOnlyStr?: string,
  defaultFallback: string = '08:00 am'
): string => {
  if (!timeOnlyStr) return defaultFallback;
  try {
    const [hStr, mStr] = timeOnlyStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
    return formatTimeForDisplay(d);
  } catch {
    return defaultFallback;
  }
};

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Time Picker Modal State
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [selectedItemForTime, setSelectedItemForTime] = useState<NotificationSetting | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'todays_plan',
      titleKey: 'notifications.items.todays_plan.title',
      descriptionKey: 'notifications.items.todays_plan.description',
      isEnabled: true,
      time: '07:30 am',
    },
    {
      id: 'morning_plan',
      titleKey: 'notifications.items.morning_plan.title',
      descriptionKey: 'notifications.items.morning_plan.description',
      isEnabled: true,
      time: '08:00 am',
    },
    {
      id: 'afternoon_plan',
      titleKey: 'notifications.items.afternoon_plan.title',
      descriptionKey: 'notifications.items.afternoon_plan.description',
      isEnabled: true,
      time: '01:00 pm',
    },
    {
      id: 'evening_plan',
      titleKey: 'notifications.items.evening_plan.title',
      descriptionKey: 'notifications.items.evening_plan.description',
      isEnabled: true,
      time: '07:00 pm',
    },
    {
      id: 'today_results',
      titleKey: 'notifications.items.today_results.title',
      descriptionKey: 'notifications.items.today_results.description',
      isEnabled: true,
      time: '08:45 pm',
    },
  ]);

  // Map raw API / Storage data into component state
  const applyNotificationData = (notifData: any) => {
    if (!notifData) return;

    setNotifications((prev) =>
      prev.map((item) => {
        switch (item.id) {
          case 'todays_plan':
            return {
              ...item,
              isEnabled:
                typeof notifData.todaysPlanNotification === 'boolean'
                  ? notifData.todaysPlanNotification
                  : item.isEnabled,
              time: convertTimeOnlyToDisplay(notifData.todaysPlanTime, item.time),
            };
          case 'morning_plan':
            return {
              ...item,
              isEnabled:
                typeof notifData.morningPlanNotification === 'boolean'
                  ? notifData.morningPlanNotification
                  : item.isEnabled,
              time: convertTimeOnlyToDisplay(notifData.morningPlanTime, item.time),
            };
          case 'afternoon_plan':
            return {
              ...item,
              isEnabled:
                typeof notifData.afternoonPlanNotification === 'boolean'
                  ? notifData.afternoonPlanNotification
                  : item.isEnabled,
              time: convertTimeOnlyToDisplay(notifData.afternoonPlanTime, item.time),
            };
          case 'evening_plan':
            return {
              ...item,
              isEnabled:
                typeof notifData.eveningPlanNotification === 'boolean'
                  ? notifData.eveningPlanNotification
                  : item.isEnabled,
              time: convertTimeOnlyToDisplay(notifData.eveningPlanTime, item.time),
            };
          case 'today_results':
            return {
              ...item,
              isEnabled:
                typeof notifData.todaysResultNotification === 'boolean'
                  ? notifData.todaysResultNotification
                  : item.isEnabled,
              time: convertTimeOnlyToDisplay(notifData.todaysResultTime, item.time),
            };
          default:
            return item;
        }
      })
    );
  };

  // Load cached data from local storage on mount
  useEffect(() => {
    const loadNotificationSettings = async () => {
      setIsLoading(true);
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          applyNotificationData(parsed);
        }
      } catch (cacheErr) {
        console.error('Failed to read notifications from local storage:', cacheErr);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationSettings();
  }, []);

  // Build API Request Payload
  const buildApiPayload = (updatedList: NotificationSetting[]) => {
    const findItem = (id: NotificationKey) => updatedList.find((x) => x.id === id);

    const todaysPlan = findItem('todays_plan');
    const morningPlan = findItem('morning_plan');
    const afternoonPlan = findItem('afternoon_plan');
    const eveningPlan = findItem('evening_plan');
    const todaysResult = findItem('today_results');

    return {
      todaysPlanNotification: todaysPlan?.isEnabled ?? false,
      todaysPlanTime: convertDisplayToTimeOnly(todaysPlan?.time || '07:30 am'),
      morningPlanNotification: morningPlan?.isEnabled ?? false,
      morningPlanTime: convertDisplayToTimeOnly(morningPlan?.time || '08:00 am'),
      afternoonPlanNotification: afternoonPlan?.isEnabled ?? false,
      afternoonPlanTime: convertDisplayToTimeOnly(afternoonPlan?.time || '01:00 pm'),
      eveningPlanNotification: eveningPlan?.isEnabled ?? false,
      eveningPlanTime: convertDisplayToTimeOnly(eveningPlan?.time || '07:00 pm'),
      todaysResultNotification: todaysResult?.isEnabled ?? false,
      todaysResultTime: convertDisplayToTimeOnly(todaysResult?.time || '08:45 pm'),
    };
  };

  // Sync to AsyncStorage
  const updateLocalStorage = async (updatedList: NotificationSetting[]) => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        const payload = buildApiPayload(updatedList);
        const updatedData = {
          ...parsed,
          ...payload,
          notifications: payload,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Failed to sync notifications cache:', error);
    }
  };

  // API Dispatch Helper
  const syncNotificationSettings = async (
    updatedList: NotificationSetting[],
    targetId: string,
    revertCallback: () => void
  ) => {
    setUpdatingId(targetId);
    const payload = buildApiPayload(updatedList);

    await putApi(
      notificationsUserAPI,
      payload,
      async () => {
        setUpdatingId(null);
        await updateLocalStorage(updatedList);
      },
      (err: any) => {
        setUpdatingId(null);
        revertCallback();
        Alert.alert(
          t('notifications.alerts.errorTitle'),
          err?.message || t('notifications.alerts.genericUpdateError')
        );
      }
    );
  };

  // Switch Toggle Handler
  const toggleSwitch = (id: NotificationKey) => {
    const previousState = [...notifications];
    const updatedList = notifications.map((item) =>
      item.id === id ? { ...item, isEnabled: !item.isEnabled } : item
    );

    setNotifications(updatedList);
    syncNotificationSettings(updatedList, id, () => setNotifications(previousState));
  };

  // Open Native Clock Modal
  const handleEditTime = (item: NotificationSetting) => {
    setSelectedItemForTime(item);
    setTempPickerDate(parseDisplayTimeToDate(item.time));
    setShowPicker(true);
  };

  // Time Picker Selection Handler
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate && selectedItemForTime) {
      const newDisplayTime = formatTimeForDisplay(selectedDate);
      const previousState = [...notifications];

      const updatedList = notifications.map((item) =>
        item.id === selectedItemForTime.id ? { ...item, time: newDisplayTime } : item
      );

      setNotifications(updatedList);
      syncNotificationSettings(updatedList, selectedItemForTime.id, () =>
        setNotifications(previousState)
      );
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

        <Text style={styles.headerTitle}>{t('notifications.screenTitle')}</Text>
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
          <Text style={styles.topNoticeText}>{t('notifications.topNotice')}</Text>

          {/* Cards List */}
          <View style={styles.cardsContainer}>
            {notifications.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#29B6F6" />
                  ) : (
                    <Switch
                      trackColor={{ false: '#2C303E', true: '#29B6F6' }}
                      thumbColor={item.isEnabled ? '#FFFFFF' : '#8E93A6'}
                      ios_backgroundColor="#2C303E"
                      onValueChange={() => toggleSwitch(item.id)}
                      value={item.isEnabled}
                    />
                  )}
                </View>

                <Text style={styles.cardDescription}>{t(item.descriptionKey)}</Text>

                {item.isEnabled && item.time && (
                  <View style={styles.timeContainer}>
                    <View style={styles.divider} />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.timePickerButton}
                      onPress={() => handleEditTime(item)}
                    >
                      <View style={styles.timeTextRow}>
                        <Clock size={moderateScale(20)} color="#29B6F6" />
                        <Text style={styles.timeText}>{item.time}</Text>
                      </View>
                      <Pencil size={moderateScale(16)} color="#29B6F6" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.bottomNoticeText}>{t('notifications.bottomNotice')}</Text>
        </ScrollView>
      )}

      {/* Clock Time Picker Dialog */}
      {showPicker && (
        <DateTimePicker
          value={tempPickerDate}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={handleTimeChange}
        />
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(6),
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginRight: scaleWidth(10),
  },
  cardDescription: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: moderateScale(18),
  },
  timeContainer: {
    marginTop: scaleHeight(12),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: scaleHeight(12),
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(2),
  },
  timeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  timeText: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default NotificationsScreen;