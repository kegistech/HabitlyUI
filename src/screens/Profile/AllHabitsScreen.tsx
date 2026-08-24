// src/screens/Habits/AllHabitsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Activity, CheckCircle2, Target } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi } from '../../services/commonAPIs';
import { upcomingHabitsAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'AllHabits'>;

type TabType = 'REGULAR' | 'ONE_TIME';

export interface UpcomingHabitResponse {
  habitId: number;
  name: string;
  description?: string;
  colorCodeId: number;
  targetValue: number;
  completedValue: number;
  pendingValue: number;
  valueTypeName: string;
  goalTypeName: string;
  habitType: number; // 1: Regular Habit, 2: One-Time Task
  isCompleted: boolean;
  reminders: string[];
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

const AllHabitsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('REGULAR');
  const [allHabits, setAllHabits] = useState<UpcomingHabitResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchUpcomingHabits();
  }, []);

  const fetchUpcomingHabits = async () => {
    setIsLoading(true);
    await getApi(
      upcomingHabitsAPI,
      (res: ApiResponse<UpcomingHabitResponse[]>) => {
        setIsLoading(false);
        if (res?.succeeded && Array.isArray(res.data)) {
          setAllHabits(res.data);
        } else {
          setAllHabits([]);
        }
      },
      (err: any) => {
        setIsLoading(false);
        setAllHabits([]);
        Alert.alert('Error', err?.message || 'Failed to fetch upcoming habits.');
      }
    );
  };

  // Filter habits according to active tab based on habitType (1 = Regular, 2 = One-Time)
  const displayedHabits = useMemo(() => {
    return allHabits.filter((habit) => {
      if (activeTab === 'REGULAR') {
        return habit.habitType === 1;
      }
      if (activeTab === 'ONE_TIME') {
        return habit.habitType === 2;
      }
      return true;
    });
  }, [allHabits, activeTab]);

  const handleNavigateToDetails = (item: UpcomingHabitResponse) => {
    navigation.navigate('HabitDetails', {
      habitData: item
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* 1. Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>All habits</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* 2. Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'REGULAR' && styles.activeTabButton]}
          onPress={() => setActiveTab('REGULAR')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'REGULAR' && styles.activeTabText,
            ]}
          >
            REGULAR HABITS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'ONE_TIME' && styles.activeTabButton]}
          onPress={() => setActiveTab('ONE_TIME')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'ONE_TIME' && styles.activeTabText,
            ]}
          >
            ONE-TIME TASKS
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#29B6F6" />
          </View>
        ) : displayedHabits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Target size={42} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyText}>
              {activeTab === 'REGULAR'
                ? 'No regular habits found.'
                : 'No one-time tasks found.'}
            </Text>
          </View>
        ) : (
          <View style={styles.tabContentContainer}>
            {displayedHabits.map((item) => {
              const progressPercent = Math.min(
                100,
                Math.round((item.completedValue / Math.max(1, item.targetValue)) * 100)
              );

              return (
                <TouchableOpacity
                  key={item.habitId}
                  activeOpacity={0.8}
                  style={styles.habitCard}
                  onPress={() => handleNavigateToDetails(item)}
                >
                  {/* Card Header Row */}
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
                          <Activity size={22} color="#29B6F6" />
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
                          <Text style={styles.badgeText}>{item.goalTypeName || 'Daily'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.habitCardRight}>
                      <Text style={styles.progressCounter}>
                        <Text style={styles.currentProgress}>{item.completedValue}</Text>/
                        {item.targetValue}
                      </Text>
                      <Text style={styles.progressUnit}>
                        {item.valueTypeName || 'times'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
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
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161820',
  },

  /* Header Bar */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#1E222D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: scaleWidth(40),
  },

  /* Tabs Bar */
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#29B6F6',
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#8E93A6',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#29B6F6',
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(40),
  },
  tabContentContainer: {
    gap: scaleHeight(14),
  },

  /* Dashboard Matching Habit Card */
  habitCard: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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

  /* Progress Bar */
  progressBarBackground: {
    height: scaleHeight(6),
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(3),
    marginTop: scaleHeight(12),
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
});

export default AllHabitsScreen;