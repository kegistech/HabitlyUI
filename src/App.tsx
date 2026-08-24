import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

import RootNavigator from './navigation/RootNavigator';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { API_KEY } from './constants/revenuecat';
import { getUserId } from './services/commonAPIs';

const App = (): React.JSX.Element => {
   const [isReady, setIsReady] = useState(false);

  useEffect(() => {
   Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); //For Dev Only

    if (!API_KEY) {
      console.error('RevenueCat API_KEY is missing.');
      return;
    }

    const initRevenueCat = async () => {
      try {
        const userId = await getUserId();

        // FIX for Error 7626: Ensure userId is genuinely valid before passing it
        const isValidUserId = userId && userId !== 'null' && userId !== 'undefined' && userId !== '';

        if (isValidUserId && API_KEY) {
          Purchases.configure({ apiKey: API_KEY, appUserID: userId.toString() });
        } else if (API_KEY) {
          Purchases.configure({ apiKey: API_KEY }); // Anonymous user
        }
        setIsReady(true);
      } catch (error) {
        console.error("Failed to configure RevenueCat", error);
      }
    };

    initRevenueCat();
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
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;