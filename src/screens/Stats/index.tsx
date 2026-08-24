// src/screens/Stats/YourStatsScreen.tsx
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
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Check,
  TrendingUp,
  BarChart2,
  Star,
} from 'lucide-react-native';

import AppLayout from '../AppLayout';
import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi } from '../../services/commonAPIs';
import { habitStatsAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface CalendarDayStat {
  date: string;
  dayNumber: number;
  completionStatus: number; // 0: None, 1: Partial/Some, 2: All complete
  totalScheduledHabits: number;
  completedHabitsCount: number;
}

export interface HabitStatsData {
  month: number;
  year: number;
  calendarDays: CalendarDayStat[];
  currentStreak: number;
  longestStreak: number;
  totalPerfectDays: number;
  totalTimesCompleted: number;
  habitCompletionRate: number;
  averagePerDaily: number;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

const StatsScreen: React.FC<Props> = ({ navigation }) => {
  // Default to current Month and Year
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  
  const [statsData, setStatsData] = useState<HabitStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch Stats API
  const fetchStats = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    const endpoint = `${habitStatsAPI}?month=${month}&year=${year}`;

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
  }, []);

  useEffect(() => {
    fetchStats(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchStats]);

  // Handle Month Navigation
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

  // Render Dynamic Calendar Grid with API Completion Status
  const renderCalendarDays = () => {
    if (!statsData || !statsData.calendarDays) return null;

    const days = [];
    
    // Determine start day index for offset (0: Sun, 1: Mon, ..., 6: Sat)
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

    // Render leading empty padding cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`pad-${i}`} style={styles.calendarDayCell} />);
    }

    // Render API calendar day cells
    statsData.calendarDays.forEach((item) => {
      const isAllComplete = item.completionStatus === 2;
      const isSomeComplete = item.completionStatus === 1;

      days.push(
        <View key={`day-${item.dayNumber}`} style={styles.calendarDayCell}>
          <View
            style={[
              styles.dayCircle,
              isAllComplete && styles.allCompleteCircle,
              isSomeComplete && styles.someCompleteRing,
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                isAllComplete && styles.allCompleteDayText,
              ]}
            >
              {item.dayNumber}
            </Text>
          </View>
        </View>
      );
    });

    return days;
  };

  return (
    <AppLayout navigation={navigation} currentRoute="Stats" title="Your stats">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Monthly Calendar Card */}
        <View style={styles.card}>
          {/* Month Navigation Header */}
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

          {/* Days of Week Header */}
          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Dynamic Calendar Grid */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#29B6F6" />
            </View>
          ) : (
            <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00E676' }]} />
              <Text style={styles.legendText}>All complete</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendRing, { borderColor: '#00E676' }]} />
              <Text style={styles.legendText}>Some complete</Text>
            </View>
          </View>
        </View>

        {/* 2. Motivational Speech Banner */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            The first step is the hardest. No hesitations — you can make it.
          </Text>
        </View>

        {/* 3. Streak Banner Card */}
        <View style={styles.streakCard}>
          {/* Left Text Content */}
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakValue}>
              {statsData ? `${statsData.currentStreak} days` : '0 days'}
            </Text>
            <Text style={styles.streakLabel}>Your current streak</Text>

            <View style={styles.longestStreakRow}>
              <Trophy
                size={moderateScale(18)}
                color="#FFC107"
                style={{ marginRight: scaleWidth(6) }}
              />
              <Text style={styles.longestStreakValue}>
                {statsData ? `${statsData.longestStreak} days` : '0 days'}
              </Text>
            </View>
            <Text style={styles.longestStreakLabel}>Your longest streak</Text>
          </View>

          {/* Right Graphic / Medal Art */}
          <View style={styles.streakGraphicContainer}>
            <View style={styles.greenBushBackground} />
            <View style={styles.medalCircle}>
              <Star size={moderateScale(38)} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* 4. 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            {/* Total Perfect Days */}
            <View style={[styles.card, styles.gridCard]}>
              <Calendar size={moderateScale(22)} color="#AB47BC" />
              <Text style={styles.gridStatValue}>
                {statsData ? `${statsData.totalPerfectDays} days` : '0 days'}
              </Text>
              <Text style={styles.gridStatLabel}>Total perfect days</Text>
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

          {/* Row 2 */}
          <View style={styles.gridRow}>
            {/* Habit Completion Rate */}
            <View style={[styles.card, styles.gridCard]}>
              <TrendingUp size={moderateScale(22)} color="#FF7043" />
              <Text style={styles.gridStatValue}>
                {statsData ? `${statsData.habitCompletionRate}%` : '0%'}
              </Text>
              <Text style={styles.gridStatLabel}>Habit completion rate</Text>
            </View>

            {/* Average Per Daily */}
            <View style={[styles.card, styles.gridCard]}>
              <BarChart2 size={moderateScale(22)} color="#FF5252" />
              <Text style={styles.gridStatValue}>
                {statsData ? statsData.averagePerDaily.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.gridStatLabel}>Average per daily</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(100),
  },

  /* Card Base */
  card: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: scaleHeight(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  /* Calendar Card */
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(4),
  },
  monthTitle: {
    fontSize: moderateScale(16),
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
    marginBottom: scaleHeight(8),
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
  allCompleteCircle: {
    backgroundColor: '#00E676',
  },
  someCompleteRing: {
    borderWidth: 2,
    borderColor: '#00E676',
  },
  calendarDayText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#E1E4ED',
  },
  allCompleteDayText: {
    color: '#000000',
    fontWeight: '800',
  },
  loaderContainer: {
    paddingVertical: scaleHeight(30),
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleWidth(24),
    marginTop: scaleHeight(8),
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    marginRight: scaleWidth(8),
  },
  legendRing: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    borderWidth: 2,
    marginRight: scaleWidth(8),
  },
  legendText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#A0A5B5',
  },

  /* Speech Quote Card */
  quoteCard: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: scaleHeight(12),
  },
  quoteText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#D1D5E4',
    lineHeight: moderateScale(20),
  },

  /* Streak Hero Banner */
  streakCard: {
    backgroundColor: '#2558D8',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    overflow: 'hidden',
    minHeight: scaleHeight(160),
    ...Platform.select({
      ios: {
        shadowColor: '#2558D8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  streakTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  streakValue: {
    fontSize: moderateScale(34),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: scaleHeight(2),
  },
  streakLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: scaleHeight(18),
  },
  longestStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  longestStreakValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  longestStreakLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: scaleHeight(2),
  },
  streakGraphicContainer: {
    width: scaleWidth(120),
    height: scaleWidth(120),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  greenBushBackground: {
    position: 'absolute',
    width: scaleWidth(90),
    height: scaleWidth(90),
    borderRadius: scaleWidth(45),
    backgroundColor: '#00C853',
    bottom: -10,
    right: -10,
  },
  medalCircle: {
    width: scaleWidth(76),
    height: scaleWidth(76),
    borderRadius: scaleWidth(38),
    backgroundColor: '#FFB300',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFD54F',
    zIndex: 3,
  },

  /* 2x2 Stats Grid */
  statsGrid: {
    gap: scaleHeight(12),
  },
  gridRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  gridCard: {
    flex: 1,
    marginBottom: 0,
    minHeight: scaleHeight(115),
    justifyContent: 'space-between',
  },
  gridStatValue: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: scaleHeight(8),
  },
  gridStatLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#8E93A6',
  },
});

export default StatsScreen;