// src/screens/Splash/index.tsx
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight } from '../../styles/responsive';
import { getAuthToken } from '../../services/commonAPIs';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      // Ensure splash logo is visible smoothly for at least 1.5 seconds
      const [token] = await Promise.all([
        getAuthToken(),
        new Promise((resolve:any) => setTimeout(resolve, 1500)),
      ]);

      if (token) {
        // Authenticated user -> Redirect to Dashboard
        navigation.replace('Dashboard');
      } else {
        // Unauthenticated -> Redirect to Login or Auth stack
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Session Check Error:', error);
      navigation.replace('Auth');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: scaleWidth(180),
    height: scaleHeight(180),
  },
});

export default SplashScreen;