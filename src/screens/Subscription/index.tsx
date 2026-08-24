// src/screens/Subscription/SubscriptionScreen.tsx
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
  Linking,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import Purchases, { PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { manageSubscriptionAPI } from '../../services/apiendpoints';
import { postApi } from '../../services/commonAPIs';
import { useSubscription } from '../../context/SubscriptionContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

type PlanType = 'YEARLY' | 'MONTHLY';

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { userData } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('YEARLY');
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [packages, setPackages] = useState<{ yearly?: PurchasesPackage; monthly?: PurchasesPackage }>({});

  useEffect(() => {
    fetchOfferings();
  }, []);

  // Fetch offerings from RevenueCat
  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages({
          yearly: offerings.current.annual || undefined,
          monthly: offerings.current.monthly || undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching offerings:', error);
      Alert.alert('Store Error', 'Could not load subscription packages.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync tracking with C# backend endpoint
   */
  const trackSubscriptionStatus = async (
    status: number,
    pkg: PurchasesPackage,
    customerInfo?: any,
    errorMessage?: string,
    forceEventType?: string
  ) => {
    const months = selectedPlan === 'YEARLY' ? 12 : 1;

    let eventType = forceEventType;

    if (!eventType) {
      if (status === 1) {
        eventType = userData?.isProUser ? 'RENEWAL' : 'INITIAL_PURCHASE';
      } else if (status === 2) {
        eventType = 'CANCELLATION';
      } else {
        eventType = 'EXPIRATION';
      }
    }

    const payload = {
      EventType: eventType,
      Status: status,
      ProductId: pkg.product.identifier,
      Amount: pkg.product.price,
      TransactionId: customerInfo?.nonSubscriptionTransactions[0]?.transactionIdentifier || 'N/A',
      ExpirationMonth: months,
      ErrorNote: errorMessage || '',
    };

    postApi(
      manageSubscriptionAPI,
      payload,
      (response: any) => {
        console.log(`Backend sync (${eventType}):`, response.succeeded ? 'Success' : 'Failed');
      },
      (error: any) => {
        console.error('Backend sync network error:', error);
      }
    );
  };

  // Handle Purchase Flow via RevenueCat
  const handlePurchase = async () => {
 
    const packageToBuy = selectedPlan === 'YEARLY' ? packages.yearly : packages.monthly;

    if (!packageToBuy) {
      Alert.alert('Error', 'Selected plan is currently unavailable.');
      return;
    }

    setProcessing(true);
    try {
   
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
 
      if (customerInfo.entitlements.active['Habitly Pro']?.isActive) {
        await trackSubscriptionStatus(1, packageToBuy, customerInfo);

        Alert.alert('Success!', 'Your account has been upgraded.', [
          { text: 'Continue', onPress: () => navigation.replace('Profile') },
        ]);
      }
    } catch (error: any) {
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        await trackSubscriptionStatus(2, packageToBuy);
      } else {
        await trackSubscriptionStatus(3, packageToBuy, undefined, error.message);
        Alert.alert('Payment Failed', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle Restore Flow
  const handleRestore = async () => {
    setProcessing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['Habitly Pro']?.isActive) {
        Alert.alert('Restored', 'Your subscription was successfully restored.');
        navigation.replace('Profile');
      } else {
        Alert.alert('No Subscription', "We couldn't find an active subscription to restore.");
      }
    } catch (e: any) {
      Alert.alert('Error', 'Restore failed: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Cancel / Subscription Settings Link
  const handleCancelSubscription = async () => {
    Alert.alert(
      'Manage Subscription',
      'You will be redirected to the App Store/Play Store settings to manage or cancel your plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/account/subscriptions');
              } else {
                Linking.openURL('https://play.google.com/store/account/subscriptions');
              }

              const activePkg = selectedPlan === 'YEARLY' ? packages.yearly : packages.monthly;
              if (activePkg) {
                await trackSubscriptionStatus(
                  2,
                  activePkg,
                  undefined,
                  'User initiated cancellation flow',
                  'CANCELLATION'
                );
              }
            } catch (err) {
              Alert.alert('Error', 'Could not open subscription settings.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Header with Close & Restore Buttons */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          disabled={processing}
        >
          <X size={moderateScale(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={processing}>
          <Text style={styles.restoreText}>RESTORE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Hero Title */}
        <Text style={styles.heroTitle}>Elevate Your Efficiency with Habitly</Text>

        {/* Pricing Options */}
        <View style={styles.plansContainer}>
          {/* YEARLY PLAN */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.planCard,
              selectedPlan === 'YEARLY' && styles.selectedPlanCard,
              styles.yearlyCardWrapper,
            ]}
            onPress={() => setSelectedPlan('YEARLY')}
            disabled={processing}
          >
            <View style={styles.bestOfferBadge}>
              <Text style={styles.bestOfferText}>BEST OFFER</Text>
            </View>

            <View style={styles.planCardContent}>
              <View style={styles.planTitleGroup}>
                <Text style={styles.planTitle}>Yearly</Text>

                <Text style={styles.planPriceMain}>
                  {packages.yearly ? `${packages.yearly.product.priceString}` : 'Loading...'}
                </Text>
              </View>

              <Text style={styles.planSubtitle}>1 Year Access • Best Value</Text>
            </View>
          </TouchableOpacity>

          {/* MONTHLY PLAN */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.planCard, selectedPlan === 'MONTHLY' && styles.selectedPlanCard]}
            onPress={() => setSelectedPlan('MONTHLY')}
            disabled={processing}
          >
            <View style={styles.planCardContent}>
              <View style={styles.planTitleGroup}>
                <Text style={styles.planTitle}>Monthly</Text>
                <Text style={styles.planPriceMain}>
                  {packages.monthly ? `${packages.monthly.product.priceString}/Month` : 'Loading...'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Optional Existing User Cancel/Manage Subscription Action */}
        {userData?.isProUser && (
          <TouchableOpacity
            style={{ marginTop: moderateScale(12), alignItems: 'center' }}
            onPress={handleCancelSubscription}
            disabled={processing}
          >
            <Text style={styles.manageSubscriptionText}>Cancel or Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Sticky CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.continueButton, { opacity: processing ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Dynamic Billing Subtext */}
        <Text style={styles.priceSummaryText}>
          {selectedPlan === 'YEARLY'
            ? packages.yearly
              ? `${packages.yearly.product.priceString}/year`
              : 'Yearly Plan'
            : packages.monthly
            ? `${packages.monthly.product.priceString}/month`
            : 'Monthly Plan'}
        </Text>
        <Text style={styles.disclaimerText}>
          {Platform.OS === 'ios' ? 'SECURE PAYMENT VIA APP STORE' : 'SECURE PAYMENT VIA GOOGLE PLAY'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header Bar */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  closeButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    color: '#8E93A6',
    fontWeight: 'bold',
    fontSize: moderateScale(12),
    letterSpacing: 1,
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
    paddingBottom: scaleHeight(20),
  },

  /* Logo Graphic */
  logoContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  logoImage: {
    width: scaleWidth(80),
    height: scaleWidth(80),
  },

  /* Hero Title */
  heroTitle: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: moderateScale(34),
    marginBottom: scaleHeight(32),
  },

  /* Pricing Options Container */
  plansContainer: {
    gap: scaleHeight(16),
    marginBottom: scaleHeight(16),
  },

  /* Base Plan Card Style */
  planCard: {
    backgroundColor: '#161820',
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: '#2A2E3D',
    overflow: 'hidden',
  },
  selectedPlanCard: {
    borderColor: '#3B82F6',
  },

  /* Yearly Card Specifics */
  yearlyCardWrapper: {
    backgroundColor: '#1E222D',
  },
  bestOfferBadge: {
    backgroundColor: '#3B82F6',
    paddingVertical: scaleHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestOfferText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  planCardContent: {
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(18),
  },
  planTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planPriceMain: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planSubtitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#8E93A6',
    marginTop: scaleHeight(6),
  },

  manageSubscriptionText: {
    color: '#8E93A6',
    textDecorationLine: 'underline',
    fontSize: moderateScale(13),
  },

  /* Sticky Bottom Section */
  bottomBar: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(20),
    backgroundColor: '#0B0C10',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: moderateScale(28),
    height: scaleHeight(54),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
  },
  continueButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceSummaryText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleHeight(6),
  },
  disclaimerText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#8E93A6',
    letterSpacing: 0.5,
  },
});

export default SubscriptionScreen;