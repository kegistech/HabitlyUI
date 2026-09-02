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
import { X, Check } from 'lucide-react-native';
import Purchases, { PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { manageSubscriptionAPI } from '../../services/apiendpoints';
import { postApi } from '../../services/commonAPIs';
import { useSubscription } from '../../context/SubscriptionContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;
type PlanType = 'YEARLY' | 'MONTHLY';

// Replace these URLs with your actual policy links
const PRIVACY_POLICY_URL = 'https://www.kegistech.com/habitly-privacy-policy.html';
const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const FEATURES = [
  'Unlimited Habit Tracking & Reminders',
  'Advanced Analytics & Progress Insights',
  'Ad-Free Premium Experience',
];

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { userData } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('YEARLY');
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [packages, setPackages] = useState<{ yearly?: PurchasesPackage; monthly?: PurchasesPackage }>({});

  useEffect(() => {
    fetchOfferings();
  }, []);

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

  const openWebLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the link: ' + url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

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

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Manage Subscription',
      'You will be redirected to subscription settings to manage or cancel your plan.',
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

  // Helper to format monthly equivalent for yearly price
  const getYearlyMonthlyEquivalent = (): string => {
    if (!packages.yearly) return '';
    const monthlyCost = packages.yearly.product.price / 12;
    const currencySymbol = packages.yearly.product.priceString.replace(/[\d.,\s]/g, '');
    return `${currencySymbol}${monthlyCost.toFixed(2)}/month`;
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
        <Text style={styles.heroTitle}>Elevate Your Efficiency</Text>

        {/* Mandatory Apple Requirement: Feature Breakdown */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={moderateScale(18)} color="#3B82F6" style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

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

              <Text style={styles.planSubtitle}>
                1 Year Access • {getYearlyMonthlyEquivalent()}
              </Text>
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

      {/* Bottom Sticky Section with Auto-Renewal & Legal Info */}
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

        {/* Mandatory Apple Disclosures & Links */}
        <Text style={styles.autoRenewText}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>

        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={() => openWebLink(EULA_URL)}>
            <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => openWebLink(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: scaleHeight(16),
  },
  logoImage: {
    width: scaleWidth(70),
    height: scaleWidth(70),
  },

  /* Hero Title */
  heroTitle: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: moderateScale(30),
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },

  /* Feature List Styling */
  featuresContainer: {
    marginBottom: scaleHeight(24),
    gap: scaleHeight(10),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: scaleWidth(10),
  },
  featureText: {
    fontSize: moderateScale(14),
    color: '#D1D5DB',
    fontWeight: '500',
  },

  /* Pricing Options Container */
  plansContainer: {
    gap: scaleHeight(14),
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
    paddingVertical: scaleHeight(5),
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
    paddingVertical: scaleHeight(16),
  },
  planTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: moderateScale(18),
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
    marginTop: scaleHeight(4),
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
    paddingBottom: scaleHeight(16),
    backgroundColor: '#0B0C10',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: moderateScale(28),
    height: scaleHeight(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(8),
  },
  continueButtonText: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceSummaryText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleHeight(4),
  },
  disclaimerText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#8E93A6',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(8),
  },
  autoRenewText: {
    fontSize: moderateScale(10),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scaleHeight(8),
    paddingHorizontal: scaleWidth(10),
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLinkText: {
    fontSize: moderateScale(11),
    color: '#8E93A6',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    fontSize: moderateScale(11),
    color: '#8E93A6',
    marginHorizontal: scaleWidth(8),
  },
});

export default SubscriptionScreen;