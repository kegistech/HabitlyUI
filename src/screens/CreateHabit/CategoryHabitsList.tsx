// src/screens/Habits/HabitTemplatesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Info,
  Laptop,
  Globe,
  BookOpen,
  GlassWater,
  Activity,
  Smile,
  Sparkles,
  Moon,
  Footprints,
  TrendingUp,
  Home,
  HeartIcon,
  Flame,
  CheckSquare,
} from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi } from '../../services/commonAPIs';
import { habitsMasterAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryHabitsList'>;

interface ExtraData {
  description?: string;
  imageName?: string;
  iconColor?: string;
  isTrendingHabit?: boolean;
  habitCategoryId?: number;
}

interface DropdownResponseDto {
  id: number | string;
  name: string;
  codeOrSubTitle?: string;
  extraData?: ExtraData;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

interface HabitItem {
  id: number | string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
}

// Map server icon strings to Lucide components
const getLucideIcon = (iconName?: string) => {
  switch (iconName?.toLowerCase()) {
    case 'laptop':
    case 'study':
      return Laptop;
    case 'globe':
    case 'language':
      return Globe;
    case 'book':
    case 'bookopen':
    case 'read':
      return BookOpen;
    case 'glasswater':
    case 'water':
      return GlassWater;
    case 'activity':
    case 'exercise':
      return Activity;
    case 'smile':
    case 'brush':
      return Smile;
    case 'sparkles':
    case 'meditate':
      return Sparkles;
    case 'moon':
    case 'sleep':
      return Moon;
    case 'footprints':
    case 'walk':
      return Footprints;
    case 'trending':
    case 'trendingup':
      return TrendingUp;
    case 'home':
      return Home;
    case 'heart':
      return HeartIcon;
    case 'flame':
      return Flame;
    default:
      return Sparkles;
  }
};

const CategoryHabitsListScreen: React.FC<Props> = ({ navigation, route }) => {
  const categoryId = route.params?.categoryId;
  const categoryTitle = route.params?.categoryName || 'Habits';

  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchHabits = useCallback(
    async (isRefreshingCall = false) => {
      if (isRefreshingCall) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Build query params dynamically
      const queryParams = categoryId ? `?habitCategoryId=${categoryId}` : '';
      const endpoint = `${habitsMasterAPI}${queryParams}`;

      await getApi(
        endpoint,
        (res: ApiResponse<DropdownResponseDto[]>) => {
          if (res?.succeeded && Array.isArray(res.data)) {
            const formattedHabits: HabitItem[] = res.data.map((item) => {
              const extra = item.extraData || {};
              const IconComponent = getLucideIcon(extra.imageName);

              return {
                id: item.id,
                title: item.name,
                subtitle: item.codeOrSubTitle || extra.description || '',
                icon: IconComponent,
                iconColor: extra.iconColor || '#29B6F6',
              };
            });

            setHabits(formattedHabits);
          } else {
            Alert.alert('Notice', res?.message || 'Failed to retrieve habit templates.');
          }
          setIsLoading(false);
          setIsRefreshing(false);
        },
        (err: any) => {
          setIsLoading(false);
          setIsRefreshing(false);
          Alert.alert('Error', err?.message || 'Failed to connect to the server.');
        }
      );
    },
    [categoryId]
  );

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectHabit = (habit: HabitItem) => {
    navigation.navigate('CreateRegularHabit', {
      habitName: habit.title,
      habitMasterId: habit.id
    });
  };

  const handleHabitInfo = (habit: HabitItem) => {
    // Handle info modal/action
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* 1. Header Card with Shadow & Back Button */}
      <View style={styles.headerShadowContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.headerIconButton}
        >
          <ArrowLeft size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{categoryTitle}</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchHabits(true)}
            tintColor="#29B6F6"
          />
        }
      >
        {/* Count Label */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{habits.length} habits</Text>
        </View>

        {/* 2. Main List Card with Shadow */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#29B6F6" />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No habit templates found for this category.</Text>
          </View>
        ) : (
          <View style={styles.cardContentContainer}>
            {habits.map((item, index) => {
              const IconComponent = item.icon;
              const isLast = index === habits.length - 1;

              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={styles.habitRow}
                    onPress={() => handleSelectHabit(item)}
                  >
                    <View style={styles.iconContainer}>
                      <IconComponent size={moderateScale(24)} color={item.iconColor} />
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={styles.habitTitle}>{item.title}</Text>
                      {!!item.subtitle && (
                        <Text style={styles.habitSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>

                    {/* <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.infoButton}
                      onPress={() => handleHabitInfo(item)}
                    >
                      <Info size={moderateScale(18)} color="#161820" fill="#FFC107" />
                    </TouchableOpacity> */}
                  </TouchableOpacity>

                  {!isLast && <View style={styles.divider} />}
                </React.Fragment>
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
  headerShadowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E222D',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    marginHorizontal: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(8),
    borderRadius: moderateScale(14),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerIconButton: {
    padding: scaleWidth(2),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerRightSpacer: {
    width: scaleWidth(24),
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(12),
    paddingTop: scaleHeight(4),
    paddingBottom: scaleHeight(24),
  },
  countContainer: {
    marginBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(6),
  },
  countText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#8E93A6',
  },
  loaderContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#8E93A6',
  },
  cardContentContainer: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(18),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
  },
  iconContainer: {
    width: scaleWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  textContainer: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  habitTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(4),
  },
  habitSubtitle: {
    fontSize: moderateScale(13),
    color: '#8E93A6',
    lineHeight: moderateScale(17),
  },
  infoButton: {
    padding: scaleWidth(4),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default CategoryHabitsListScreen;