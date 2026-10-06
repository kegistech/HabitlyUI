// src/screens/Dashboard/TodayScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Minus, CheckCircle2, Activity, Target, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import AppLayout from '../AppLayout';
import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi, postApi, putApi } from '../../services/commonAPIs';
import { habitsByDateAPI, trackHabitAPI, updateRatingAPI } from '../../services/apiendpoints';
import { useSubscription } from '../../context/SubscriptionContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

interface CalendarDay {
  dayLabel: string;
  fullDate: Date;
  dateNumber: number;
  isToday: boolean;
}

export interface HabitListResponse {
  id: number;
  name: string;
  description?: string;
  colorCodeId: number;
  targetValue: number;
  completedValue: number;
  pendingValue: number;
  valueTypeName: string;
  goalTypeName: string;
  isCompleted: boolean;
  reminders: string[];
  colorCode: string;
}

export interface TrackHabitValueRequest {
  habitId: number;
  trackDate: string;
  value: number;
  isIncrement: boolean;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

const GOOGLE_PLAY_PACKAGE_NAME = 'com.kegistech.habitly';
const APPLE_APP_ID = '6804195230';

const DashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();

  // Dynamically calculate current week (Sunday to Saturday)
  const currentWeekDays: CalendarDay[] = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday

    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDayOfWeek);

    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);

      const isToday =
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear();

      days.push({
        dayLabel: labels[i],
        fullDate: dayDate,
        dateNumber: dayDate.getDate(),
        isToday,
      });
    }

    return days;
  }, []);

  // Default selected date: Today
  const todayDateObj = useMemo(() => {
    const foundToday = currentWeekDays.find((d) => d.isToday);
    return foundToday ? foundToday.fullDate : new Date();
  }, [currentWeekDays]);

  const [selectedDate, setSelectedDate] = useState<Date>(todayDateObj);
  const [habits, setHabits] = useState<HabitListResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [trackingHabitId, setTrackingHabitId] = useState<number | null>(null);
  const { userData, refreshProfile } = useSubscription();

  // Review Modal States
  const [isRatingModalVisible, setIsRatingModalVisible] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  // Helper to check if selected date is in the future relative to today
  const isFutureDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() > today.getTime();
  }, [selectedDate]);

  useEffect(() => {
    refreshProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHabitsByDate(selectedDate);
    }, [selectedDate])
  );

  // App Store / Play Store Review Prompt Handler
  useEffect(() => {
    const checkReviewPrompt = () => {
      const shouldAskReview = route.params?.review === 1;

      if (!shouldAskReview) return;
      if (userData?.isRateGiven) return;

      // Reset route params to prevent repeated triggers on re-render
      navigation.setParams({ review: undefined });

      // Open rating modal
      setSelectedRating(0);
      setIsRatingModalVisible(true);
    };

    checkReviewPrompt();
  }, [route.params?.review, userData?.isRateGiven]);

  // Open store review URL
  const openAppStore = async () => {
    const storeUrl = Platform.select({
      ios: `https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`,
      android: `market://details?id=${GOOGLE_PLAY_PACKAGE_NAME}`,
    });

    const webFallbackUrl = Platform.select({
      ios: `https://apps.apple.com/app/id${APPLE_APP_ID}`,
      android: `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_PACKAGE_NAME}`,
    });

    const targetUrl = storeUrl || webFallbackUrl;

    if (targetUrl) {
      const canOpen = await Linking.canOpenURL(targetUrl);
      await Linking.openURL(canOpen ? targetUrl : webFallbackUrl || '');
    }
  };

  // Submit Rate Handler
  const handleRateSubmit = async () => {
    setIsSubmittingRating(true);

    // Track Rating API
    putApi(
      updateRatingAPI,
      {},
      () => {
        setIsSubmittingRating(false);
        setIsRatingModalVisible(false);
        refreshProfile();

        // If 4 or 5 stars, redirect to App Store / Play Store
        if (selectedRating >= 4) {
          openAppStore();
        }
      },
      (error: any) => {
        setIsSubmittingRating(false);
        setIsRatingModalVisible(false);
        const serverMsg =
          error?.response?.data?.message || error?.message || 'Network error occurred.';
        console.error('Rating API error:', serverMsg);

        // Still open store if 4 or 5 stars even if API fails
        if (selectedRating >= 4) {
          openAppStore();
        }
      }
    );
  };

  // Rate Later Handler
  const handleRateLater = () => {
    setIsRatingModalVisible(false);
  };

  const fetchHabitsByDate = async (date: Date) => {
    setIsLoading(true);
    const formattedDate = date.toISOString();
    const endpoint = `${habitsByDateAPI}?date=${encodeURIComponent(formattedDate)}`;

    await getApi(
      endpoint,
      (res: ApiResponse<HabitListResponse[]>) => {
        setIsLoading(false);
        if (res?.succeeded && Array.isArray(res.data)) {
          setHabits(res.data);
        } else {
          setHabits([]);
        }
      },
      (err: any) => {
        setIsLoading(false);
        setHabits([]);
        Alert.alert(
          t('dashboard.alerts.errorTitle'),
          err?.message || t('dashboard.alerts.fetchError')
        );
      }
    );
  };

  // Track habit handler with validation and API integration
  const handleTrackHabit = async (item: HabitListResponse, isIncrement: boolean) => {
    // 1. Future Date Check
    if (isFutureDate) {
      Alert.alert(
        t('dashboard.alerts.futureDateTitle'),
        t('dashboard.alerts.futureDateMessage')
      );
      return;
    }

    const amountToTrack = 1; // Step value

    // 2. Incremental and Decremental Limit Checks
    if (isIncrement) {
      if (item.completedValue >= item.targetValue) {
        Alert.alert(
          t('dashboard.alerts.goalReachedTitle'),
          t('dashboard.alerts.goalReachedMessage')
        );
        return;
      }
    } else {
      if (item.completedValue <= 0) {
        Alert.alert(
          t('dashboard.alerts.minLimitTitle'),
          t('dashboard.alerts.minLimitMessage')
        );
        return;
      }
    }

    const payload: TrackHabitValueRequest = {
      habitId: item.id,
      trackDate: selectedDate.toISOString(),
      value: amountToTrack,
      isIncrement: isIncrement,
    };

    // Optimistic UI update
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id === item.id) {
          const newCompleted = isIncrement
            ? Math.min(h.targetValue, h.completedValue + amountToTrack)
            : Math.max(0, h.completedValue - amountToTrack);
          return {
            ...h,
            completedValue: newCompleted,
            pendingValue: Math.max(0, h.targetValue - newCompleted),
            isCompleted: newCompleted >= h.targetValue,
          };
        }
        return h;
      })
    );

    setTrackingHabitId(item.id);

    await postApi(
      trackHabitAPI,
      payload,
      (res: ApiResponse<any>) => {
        setTrackingHabitId(null);
        if (!res?.succeeded) {
          Alert.alert(
            t('dashboard.alerts.errorTitle'),
            res?.message || t('dashboard.alerts.trackError')
          );
          fetchHabitsByDate(selectedDate); // Revert state on failure
        }
      },
      (err: any) => {
        setTrackingHabitId(null);
        Alert.alert(
          t('dashboard.alerts.errorTitle'),
          err?.message || t('dashboard.alerts.connectError')
        );
        fetchHabitsByDate(selectedDate); // Revert state on failure
      }
    );
  };

  const handleAddHabit = async () => {
    // 1. Check if user is Basic and reached limit
    if (!userData?.isProUser && (userData?.totalHabits ?? 0) >= 2) {
      Alert.alert(
        t('dashboard.alerts.limitReachedTitle'),
        t('dashboard.alerts.limitReachedMessage'),
        [
          { text: t('dashboard.alerts.cancel') },
          { text: t('dashboard.alerts.upgrade'), onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    navigation.navigate('CreateHabit');
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleNavigateToDetails = (item: HabitListResponse) => {
    navigation.navigate('HabitDetails', {
      habitData: item,
    });
  };

  return (
    <AppLayout navigation={navigation} currentRoute="Dashboard" title={t('dashboard.title')}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Calendar Header Bar */}
        <View style={styles.calendarContainer}>
          {currentWeekDays.map((item) => {
            const isSelected = isSameDay(selectedDate, item.fullDate);
            return (
              <TouchableOpacity
                key={item.fullDate.toISOString()}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(item.fullDate)}
                style={[styles.dayColumn, isSelected && styles.selectedDayColumn]}
              >
                <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>
                  {item.dayLabel}
                </Text>
                <Text style={[styles.dateNumber, isSelected && styles.selectedDateNumber]}>
                  {item.dateNumber}
                </Text>
                {item.isToday && <View style={styles.todayIndicatorDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>{t('dashboard.sectionTitle')}</Text>
        </View>

        {/* Dynamic Habit List */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#29B6F6" />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Target size={42} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyText}>{t('dashboard.emptyHabits')}</Text>
          </View>
        ) : (
          habits.map((item) => {
            const progressPercent = Math.min(
              100,
              Math.round((item.completedValue / Math.max(1, item.targetValue)) * 100)
            );
            const isHabitTracking = trackingHabitId === item.id;
            const isDecrementDisabled = item.completedValue <= 0 || isFutureDate || isHabitTracking;
            const isIncrementDisabled = item.completedValue >= item.targetValue || isFutureDate || isHabitTracking;

            return (
              <View key={item.id} style={styles.habitCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleNavigateToDetails(item)}
                >
                  {/* Header Row: Icon, Habit Info, Progress Fraction */}
                  <View style={styles.habitCardTop}>
                    <View style={styles.habitCardLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          item.isCompleted && styles.completedIconContainer,
                        ]}
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 size={22} color="#00E676" />
                        ) : (
                          <Activity size={22} color={item.colorCode ? item.colorCode : '#29B6F6'} />
                        )}
                      </View>
                      <View style={styles.habitInfo}>
                        <Text style={styles.habitTitle}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.habitDescription} numberOfLines={1}>
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.badgeContainer}>
                          <Text style={styles.badgeStar}>★</Text>
                          <Text style={styles.badgeText}>
                            {item.goalTypeName || t('dashboard.defaults.goalType')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.habitCardRight}>
                      <Text style={styles.progressCounter}>
                        <Text style={styles.currentProgress}>{item.completedValue}</Text>/
                        {item.targetValue}
                      </Text>
                      <Text style={styles.progressUnit}>
                        {item.valueTypeName || t('dashboard.defaults.valueType')}
                      </Text>
                    </View>
                  </View>

                  {/* Visual Progress Bar */}
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPercent}%` },
                        item.isCompleted && styles.progressBarFillCompleted,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* Tracker Actions Row */}
                <View style={styles.trackerRow}>
                  <Text style={styles.trackingLabel}>
                    {isFutureDate
                      ? t('dashboard.tracking.disabledFuture')
                      : t('dashboard.tracking.trackToday')}
                  </Text>

                  <View style={styles.counterControls}>
                    {/* Decrement Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.actionBtn,
                        isDecrementDisabled && styles.disabledActionBtn,
                      ]}
                      disabled={isDecrementDisabled}
                      onPress={() => handleTrackHabit(item, false)}
                    >
                      <Minus
                        size={16}
                        color={isDecrementDisabled ? 'rgba(255,255,255,0.2)' : '#FFFFFF'}
                      />
                    </TouchableOpacity>

                    <Text style={styles.completedCountDisplay}>{item.completedValue}</Text>

                    {/* Increment Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.actionBtn,
                        styles.incrementBtn,
                        isIncrementDisabled && styles.disabledActionBtn,
                      ]}
                      disabled={isIncrementDisabled}
                      onPress={() => handleTrackHabit(item, true)}
                    >
                      {isHabitTracking ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Plus
                          size={16}
                          color={isIncrementDisabled ? 'rgba(255,255,255,0.2)' : '#FFFFFF'}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fabButton}
        onPress={handleAddHabit}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 5-Star Rating Modal */}
      <Modal
        visible={isRatingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRateLater}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enjoying Consistent?</Text>
            <Text style={styles.modalSubtitle}>
              Tap a star to rate your experience with us!
            </Text>

            {/* Star Rating Selection */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setSelectedRating(star)}
                  style={styles.starButton}
                >
                  <Star
                    size={32}
                    color={star <= selectedRating ? '#FFD700' : '#4A5568'}
                    fill={star <= selectedRating ? '#FFD700' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalBtn, styles.rateLaterBtn]}
                onPress={handleRateLater}
                disabled={isSubmittingRating}
              >
                <Text style={styles.rateLaterText}>Rate Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalBtn, styles.rateSubmitBtn]}
                onPress={handleRateSubmit}
                disabled={isSubmittingRating || selectedRating==0}
              >
                {isSubmittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rateSubmitText}>Rate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(100),
  },

  // Calendar Header
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(10),
    marginBottom: scaleHeight(18),
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    paddingHorizontal: scaleWidth(8),
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleWidth(40),
    paddingVertical: scaleHeight(8),
    borderRadius: moderateScale(12),
  },
  selectedDayColumn: {
    backgroundColor: '#272C3A',
  },
  dayLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: scaleHeight(4),
  },
  selectedDayLabel: {
    color: '#29B6F6',
  },
  dateNumber: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedDateNumber: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: moderateScale(18),
  },
  todayIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E676',
    marginTop: scaleHeight(4),
  },

  // Section Header
  sectionHeaderContainer: {
    marginBottom: scaleHeight(14),
    paddingHorizontal: scaleWidth(4),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.2,
  },

  // Habit Card
  habitCard: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: scaleHeight(14),
  },
  habitCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  completedIconContainer: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  habitInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  habitTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(2),
  },
  habitDescription: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: scaleHeight(4),
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeStar: {
    fontSize: moderateScale(11),
    color: '#29B6F6',
    marginRight: 3,
  },
  badgeText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#29B6F6',
  },
  habitCardRight: {
    alignItems: 'flex-end',
    marginLeft: scaleWidth(10),
  },
  progressCounter: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  currentProgress: {
    color: '#29B6F6',
  },
  progressUnit: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },

  // Progress Bar
  progressBarBackground: {
    height: scaleHeight(6),
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(3),
    marginVertical: scaleHeight(12),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#29B6F6',
    borderRadius: moderateScale(3),
  },
  progressBarFillCompleted: {
    backgroundColor: '#00E676',
  },

  // Tracker Controls Row
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(2),
  },
  trackingLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  actionBtn: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#272C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementBtn: {
    backgroundColor: '#29B6F6',
  },
  disabledActionBtn: {
    backgroundColor: 'rgba(39, 44, 58, 0.4)',
  },
  completedCountDisplay: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: scaleWidth(20),
    textAlign: 'center',
  },

  loaderContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    gap: scaleHeight(10),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },

  // Floating Action Button
  fabButton: {
    position: 'absolute',
    bottom: scaleHeight(24),
    right: scaleWidth(20),
    width: scaleWidth(58),
    height: scaleWidth(58),
    borderRadius: scaleWidth(29),
    backgroundColor: '#29B6F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#29B6F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    padding: scaleWidth(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: scaleHeight(20),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(24),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  modalActions: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: scaleHeight(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateLaterBtn: {
    backgroundColor: '#272C3A',
  },
  rateLaterText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rateSubmitBtn: {
    backgroundColor: '#29B6F6',
  },
  rateSubmitText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DashboardScreen;