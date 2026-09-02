import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

import RootNavigator from './navigation/RootNavigator';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { API_KEY } from './constants/revenuecat';
import { getUserId } from './services/commonAPIs';
import {
  requestNotificationPermission,
  createNotificationChannels,
  syncFCMTokenWithBackend,
  setupNotificationListeners,
} from './services/notificationService';



const App = (): React.JSX.Element => {
  const [isReady, setIsReady] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const userId = await getUserId();
        const isValidUserId = userId && userId !== 'null' && userId !== 'undefined' && userId !== '';

        if (isValidUserId && API_KEY) {
          Purchases.configure({ apiKey: API_KEY, appUserID: userId.toString() });
        } else if (API_KEY) {
          Purchases.configure({ apiKey: API_KEY });
        }

        // Push Notification Setup
        const granted = await requestNotificationPermission();
        if (granted) {
          await createNotificationChannels();
          await syncFCMTokenWithBackend();
          cleanupRef.current = setupNotificationListeners();
        }

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initApp();

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SubscriptionProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'left', 'right']}>
            
           {isReady && <RootNavigator />}
          </SafeAreaView>
        </NavigationContainer>
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1, backgroundColor: '#FFFFFF' },
});

export default App;