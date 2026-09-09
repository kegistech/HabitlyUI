import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  check,
  request,
  checkNotifications,
  requestNotifications,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

import { getUserId, putApi } from './commonAPIs';
import { updateRegisterTokenAPI } from './apiendpoints';

/**
 * 1. Request Notification Permissions using react-native-permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await checkNotifications();

      if (status === RESULTS.GRANTED) {
        return true;
      }

      const { status: requestStatus } = await requestNotifications([
        'alert',
        'sound',
        'badge',
      ]);

      return requestStatus === RESULTS.GRANTED;
    } else {
      // Safely access POST_NOTIFICATIONS using type casting
      const postNotificationsPermission =
        (PERMISSIONS.ANDROID as any).POST_NOTIFICATIONS ||
        'android.permission.POST_NOTIFICATIONS';

      const currentStatus = await check(postNotificationsPermission as Permission);

      if (currentStatus === RESULTS.GRANTED) {
        return true;
      }

      const requestStatus = await request(postNotificationsPermission as Permission);
      return requestStatus === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * 2. Create Notification Channels for Android
 */
export const createNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    // Personalized Habit Channel (Custom sound)
    await notifee.createChannel({
      id: 'personalized_habits',
      name: 'Habit Reminders',
      sound: 'notification_sound',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    // Global Announcements Channel (Default system sound)
    await notifee.createChannel({
      id: 'common_announcements',
      name: 'Announcements',
      sound: 'default',
      importance: AndroidImportance.DEFAULT,
    });
  }
};

/**
 * 3. Sync FCM Token with Remote Backend
 */
export const syncFCMTokenWithBackend = async (fcmToken?: string): Promise<void> => {
  try {
    const messagingInstance = getMessaging();
    const token = fcmToken || (await getToken(messagingInstance));
    if (!token) return;

    const userId = await getUserId();
    const isValidUserId =
      userId && userId !== 'null' && userId !== 'undefined' && userId !== '';
    if (!isValidUserId) return;

    const storedToken = await AsyncStorage.getItem('fcm_token');
    if (storedToken === token) return;

    const payload = {
      deviceToken: token,
      platform: Platform.OS,
    };

    // Promisified or properly handled callback response
    await new Promise<void>((resolve, reject) => {
      putApi(
        updateRegisterTokenAPI,
        payload,
        async (response: any) => {
          if (
            response &&
            (response.succeeded || response.isSuccess || response.status === 200)
          ) {
            await AsyncStorage.setItem('fcm_token', token);
          }
          resolve();
        },
        (error: any) => {
          const serverMsg =
            error?.response?.data?.message ||
            error?.message ||
            'Network error occurred while syncing token.';
          console.error('FCM Token Sync Error:', serverMsg);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Failed to sync FCM Token:', error);
  }
};

/**
 * 4. Setup Listeners for Refreshes, Foreground Messages & Press Actions
 */
export const setupNotificationListeners = () => {
  const messagingInstance = getMessaging();

  // Listen to Token Refreshes
  const unsubscribeToken = onTokenRefresh(messagingInstance, (token) => {
    syncFCMTokenWithBackend(token);
  });

  // Handle Notifications when App is in Foreground
  const unsubscribeForeground = onMessage(messagingInstance, async (remoteMessage) => {
    const { notification, data } = remoteMessage;
    const isPersonalized = data?.type === 'personalized';

    await notifee.displayNotification({
      title: notification?.title || 'Habit Reminder',
      body: notification?.body || '',
      android: {
        channelId: isPersonalized ? 'personalized_habits' : 'common_announcements',
        sound: isPersonalized ? 'notification_sound' : 'default',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
      ios: {
        sound: isPersonalized ? 'notification_sound.wav' : 'default',
      },
      data: data || {},
    });
  });

  // Handle Push Interactions (User clicks on notification banner)
  const unsubscribePress = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('User interacted with notification:', detail.notification);
    }
  });

  return () => {
    unsubscribeToken();
    unsubscribeForeground();
    unsubscribePress();
  };
};