import React from 'react';
import { View, Button, StyleSheet, Alert, Platform } from 'react-native';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { getMessaging, getToken } from '@react-native-firebase/messaging';

export const NotificationTester = () => {
  // 1. Helper to log current FCM Token
  const logFcmToken = async () => {
    try {
      const messagingInstance = getMessaging();
      const token = await getToken(messagingInstance);
      console.log('=== CURRENT DEVICE FCM TOKEN ===');
      console.log(token);
      Alert.alert('FCM Token Logged', 'Check your Metro console for the full token.');
    } catch (error) {
      console.error('Error fetching FCM Token:', error);
    }
  };

  // 2. Test Immediate Personalized Notification (Custom Sound Channel)
  const triggerPersonalizedNotification = async () => {
    try {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'personalized_habits',
          name: 'Habit Reminders',
          sound: 'habit_sound',
          importance: AndroidImportance.HIGH,
          vibration: true,
        });
      }

      await notifee.displayNotification({
        title: '🎯 Custom Habit Sound Test',
        body: 'This tests the personalized habit notification and custom sound playback.',
        android: {
          channelId: 'personalized_habits',
          sound: 'habit_sound',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'habit_sound.wav',
        },
        data: { type: 'personalized' },
      });
    } catch (error) {
      console.error('Failed to trigger notification:', error);
    }
  };

  // 3. Test Scheduled Notification (Triggers in 5 seconds)
  const scheduleTestNotification = async () => {
    try {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'personalized_habits',
          name: 'Habit Reminders',
          sound: 'habit_sound',
          importance: AndroidImportance.HIGH,
        });
      }

      const triggerTime = Date.now() + 5000; // 5 seconds from now

      await notifee.createTriggerNotification(
        {
          title: '⏰ Scheduled Habit Reminder',
          body: 'This notification was scheduled locally 5 seconds ago.',
          android: {
            channelId: 'personalized_habits',
            sound: 'habit_sound',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
          },
          ios: {
            sound: 'habit_sound.wav',
          },
          data: { type: 'personalized' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime,
        }
      );

      Alert.alert('Scheduled!', 'Minimize or close the app now. Notification will trigger in 5 seconds.');
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Log FCM Token" onPress={logFcmToken} color="#007AFF" />
      <View style={styles.spacer} />
      <Button title="Test Instant Notification" onPress={triggerPersonalizedNotification} color="#34C759" />
      <View style={styles.spacer} />
      <Button title="Schedule in 5 Seconds (Background Test)" onPress={scheduleTestNotification} color="#FF9500" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F9F9F9', borderRadius: 8, margin: 16 },
  spacer: { height: 12 },
});