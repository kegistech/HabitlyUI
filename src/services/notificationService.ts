import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  onMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId, putApi } from './commonAPIs';
import { updateRegisterTokenAPI } from './apiendpoints';


export const requestNotificationPermission = async (): Promise<boolean> => {
  const messagingInstance = getMessaging();
  const authStatus = await requestPermission(messagingInstance);
  
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
};

export const createNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    // 1. Personalized Habit Channel (Custom sound)
    await notifee.createChannel({
      id: 'personalized_habits',
      name: 'Habit Reminders',
      sound: 'notification_sound',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    // 2. Global Announcements Channel (Default system sound)
    await notifee.createChannel({
      id: 'common_announcements',
      name: 'Announcements',
      sound: 'default',
      importance: AndroidImportance.DEFAULT,
    });
  }
};

export const syncFCMTokenWithBackend = async (fcmToken?: string): Promise<void> => {
  try {
    const messagingInstance = getMessaging();
    const token = fcmToken || (await getToken(messagingInstance));
    if (!token) return;

    const userId = await getUserId();
    const isValidUserId = userId && userId !== 'null' && userId !== 'undefined' && userId !== '';
    if (!isValidUserId) return;

    const storedToken = await AsyncStorage.getItem('fcm_token');
    if (storedToken === token) return;


   const payload = {
      deviceToken: token,
      platform: Platform.OS,
    };
       putApi(
          updateRegisterTokenAPI,
          payload,
          async (response: any) => {
          
            if (response && (response.succeeded || response.isSuccess || response.status === 200)) {
            await AsyncStorage.setItem('fcm_token', token);
            } 
          },
          (error: any) => {
           
            const serverMsg =
              error?.response?.data?.message || error?.message || 'Network error occurred.';
console.log(serverMsg);
          }
        );

  } catch (error) {
    console.error('Failed to sync FCM Token:', error);
  }
};

export const setupNotificationListeners = () => {
  const messagingInstance = getMessaging();

  // Listen to Token Refreshes (SDK level updates)
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

  // Handle Push Interactions (User clicks on banner)
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