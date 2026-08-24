// src/screens/Habits/HabitDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Pencil,
  Pause,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Check,
  TrendingUp,
  Star,
  GlassWater, // Replace with dynamic icon as needed
} from 'lucide-react-native';

import AppLayout from '../AppLayout';
import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi, postApi, putApi } from '../../services/commonAPIs';
import { habitStatsAPI, archiveHabitAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetails'>;

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface CalendarDayStat {
  date: string;
  dayNumber: number;
  completionStatus: number; // 0: None, 1: Partial, 2: Complete
  totalScheduledHabits: number;
  completedHabitsCount: number;
}

export interface HabitStatsData {
  month: number;
  year: number;
  calendarDays: CalendarDayStat[];
  currentStreak: number;
  longestStreak: number;
  totalTimesCompleted: number;
  habitCompletionRate: number;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

const HabitDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { habitData } = route.params;

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const [statsData, setStatsData] = useState<HabitStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch Stats API for Specific Habit
  const fetchHabitStats = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    const endpoint = `${habitStatsAPI}?habitId=${habitData?.id}&month=${month}&year=${year}`;

    await getApi(
      endpoint,
      (res: ApiResponse<HabitStatsData>) => {
        setIsLoading(false);
        if (res?.succeeded && res.data) {
          setStatsData(res.data);
        } else {
          setStatsData(null);
        }
      },
      (err: any) => {
        setIsLoading(false);
        setStatsData(null);
        Alert.alert('Error', err?.message || 'Failed to load habit statistics.');
      }
    );
  }, [habitData]);

  useEffect(() => {
    fetchHabitStats(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchHabitStats]);

  // Action Handlers
  const handleEdit = () => {
    if (habitData?.habitType==1){
    navigation.navigate('CreateRegularHabit', { habitData :habitData});
    }
    else if (habitData?.habitType==2){
          navigation.navigate('CreateOneTimeHabit', { habitData :habitData});
    }

  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Habit',
      `Are you sure you want to archive "${habitData?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await putApi(
              `${archiveHabitAPI}/${habitData?.id}`,
              {},
              (res: any) => {
                Alert.alert('Success', 'Habit archived successfully.');
                navigation.goBack();
              },
              (err: any) => {
                Alert.alert('Error', err?.message || 'Failed to archive habit.');
              }
            );
          },
        },
      ]
    );
  };


  // Month Nav
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Render Dynamic Calendar Days
  const renderCalendarDays = () => {
    if (!statsData || !statsData.calendarDays) return null;

    const days = [];
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`pad-${i}`} style={styles.calendarDayCell} />);
    }

    statsData.calendarDays.forEach((item) => {
      const isComplete = item.completionStatus === 2 || item.completionStatus === 1;

      days.push(
        <View key={`day-${item.dayNumber}`} style={styles.calendarDayCell}>
          <View style={[styles.dayCircle, isComplete && styles.completeCircle]}>
            <Text style={[styles.calendarDayText, isComplete && styles.completeDayText]}>
              {item.dayNumber}
            </Text>
          </View>
        </View>
      );
    });

    return days;
  };

  return (
    <AppLayout navigation={navigation} currentRoute="Stats">
      {/* 1. Screen Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <ArrowLeft size={moderateScale(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEdit} style={styles.actionBtn}>
            <Pencil size={moderateScale(20)} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={handleArchive} style={styles.actionBtn}>
            <Trash2 size={moderateScale(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Top Habit Summary Section */}
        <View style={styles.habitSummaryContainer}>
          <View style={styles.habitTitleRow}>
            <View style={styles.iconBadge}>
              <GlassWater size={moderateScale(22)} color="#29B6F6" />
            </View>
            <Text style={styles.habitTitle}>{habitData?.name}</Text>
          </View>

          <Text style={styles.progressText}>
            <Text style={styles.completedCount}>{habitData?.completedValue}</Text>
            <Text style={styles.targetCount}>/{habitData?.targetValue} {habitData?.valueTypeName}</Text>
          </Text>
        </View>

        {/* 3. Monthly Calendar Grid */}
        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePrevMonth}>
              <ChevronLeft size={moderateScale(22)} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleNextMonth}>
              <ChevronRight size={moderateScale(22)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#29B6F6" />
            </View>
          ) : (
            <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
          )}
        </View>

        {/* 4. Streak Banner Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakValue}>
              {statsData ? `${statsData.currentStreak} day` : '0 day'}
            </Text>
            <Text style={styles.streakLabel}>Your current streak</Text>

            <View style={styles.longestStreakRow}>
              <Trophy size={moderateScale(16)} color="#FFC107" style={{ marginRight: scaleWidth(6) }} />
              <Text style={styles.longestStreakValue}>
                {statsData ? `${statsData.longestStreak} day` : '0 day'}
              </Text>
            </View>
            <Text style={styles.longestStreakLabel}>Your longest streak</Text>
          </View>

          <View style={styles.streakGraphicContainer}>
            <View style={styles.greenBushBackground} />
            <View style={styles.medalCircle}>
              <Star size={moderateScale(36)} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* 5. 2-Column Metrics Grid */}
        <View style={styles.gridRow}>
          {/* Completion Rate */}
          <View style={[styles.card, styles.gridCard]}>
            <TrendingUp size={moderateScale(22)} color="#FF7043" />
            <Text style={styles.gridStatValue}>
              {statsData ? `${statsData.habitCompletionRate}%` : '0%'}
            </Text>
            <Text style={styles.gridStatLabel}>Habit completion rate</Text>
          </View>

          {/* Total Times Completed */}
          <View style={[styles.card, styles.gridCard]}>
            <Check size={moderateScale(22)} color="#00E676" />
            <Text style={styles.gridStatValue}>
              {statsData ? statsData.totalTimesCompleted : 0}
            </Text>
            <Text style={styles.gridStatLabel}>Total times completed</Text>
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(16),
  },
  actionBtn: {
    padding: scaleWidth(4),
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(40),
  },
  habitSummaryContainer: {
    marginBottom: scaleHeight(20),
    marginTop: scaleHeight(8),
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  iconBadge: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(10),
    backgroundColor: 'rgba(41, 182, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(10),
  },
  habitTitle: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  completedCount: {
    color: '#29B6F6',
  },
  targetCount: {
    color: '#8E93A6',
  },
  card: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: scaleHeight(12),
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  monthTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: scaleHeight(12),
  },
  weekDayText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#8E93A6',
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: scaleWidth(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeCircle: {
    backgroundColor: '#00E676',
  },
  calendarDayText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#E1E4ED',
  },
  completeDayText: {
    color: '#000000',
    fontWeight: '800',
  },
  loaderContainer: {
    paddingVertical: scaleHeight(30),
    alignItems: 'center',
  },
  streakCard: {
    backgroundColor: '#2558D8',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    overflow: 'hidden',
  },
  streakTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  streakValue: {
    fontSize: moderateScale(32),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: scaleHeight(14),
  },
  longestStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  longestStreakValue: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  longestStreakLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakGraphicContainer: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenBushBackground: {
    position: 'absolute',
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    backgroundColor: '#00C853',
    bottom: -10,
    right: -10,
  },
  medalCircle: {
    width: scaleWidth(68),
    height: scaleWidth(68),
    borderRadius: scaleWidth(34),
    backgroundColor: '#FFB300',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD54F',
    zIndex: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  gridCard: {
    flex: 1,
    marginBottom: 0,
    minHeight: scaleHeight(110),
    justifyContent: 'space-between',
  },
  gridStatValue: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: scaleHeight(6),
  },
  gridStatLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#8E93A6',
  },
});

export default HabitDetailsScreen;