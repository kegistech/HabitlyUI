import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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

// Create Navigation Reference
export const navigationRef = createNavigationContainerRef();

const App = (): React.JSX.Element => {
  const [isReady, setIsReady] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  /**
   * Helper to sync User ID & FCM Token across RevenueCat and Backend
   */
  const syncUserSessionAndToken = async (): Promise<void> => {
    try {
      const userId = await getUserId();
      const isValidUserId =
        userId && userId !== 'null' && userId !== 'undefined' && userId !== '';

      if (isValidUserId) {
        // Identify user in RevenueCat if logged in
        if (API_KEY) {
          await Purchases.logIn(userId.toString());
        }
        // Sync FCM Token
        await syncFCMTokenWithBackend();
      }
    } catch (error) {
      console.error('Failed to sync user session and token:', error);
    }
  };

  /**
   * Callback fired every time user navigates between screens
   */
  const handleNavigationStateChange = async () => {
    if (!navigationRef.isReady()) return;

    const previousRouteName = routeNameRef.current;
    const currentRoute = navigationRef.getCurrentRoute() as { name: string } | undefined;
  const currentRouteName = currentRoute?.name;

    if (previousRouteName !== currentRouteName) {
      routeNameRef.current = currentRouteName;

      // When transitioning into main app screens post-login/signup
      if (currentRouteName && currentRouteName !== 'Login' && currentRouteName !== 'SignUp') {
        await syncUserSessionAndToken();
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Initial RevenueCat Configuration
        const userId = await getUserId();
        const isValidUserId = userId && userId !== 'null' && userId !== 'undefined' && userId !== '';
        if (isValidUserId && API_KEY) {
          Purchases.configure({ apiKey: API_KEY, appUserID: userId.toString() });
        } else if (API_KEY) {
          Purchases.configure({ apiKey: API_KEY });
        }

        // 2. Setup Push Notification System & Listeners
        const granted = await requestNotificationPermission();
        if (granted) {
          await createNotificationChannels();
          cleanupRef.current = setupNotificationListeners();
        }

        // 3. Sync immediately on cold-boot if user is already logged in
        await syncUserSessionAndToken();

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
      }
    };

    initApp();

    // 4. Listen for App coming to Foreground from Background
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await syncUserSessionAndToken();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SubscriptionProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            if (navigationRef.isReady()) {
           const currentRoute = navigationRef.getCurrentRoute() as { name: string } | undefined;
            routeNameRef.current = currentRoute?.name;
            }
          }}
          onStateChange={handleNavigationStateChange}
        >
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