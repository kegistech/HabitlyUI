// src/screens/CreateHabitMenu/index.tsx
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
  CalendarDays,
  CheckSquare,
  TrendingUp,
  Home,
  HeartIcon,
  Flame,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi } from '../../services/commonAPIs';
import { habitCategoriesAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateHabit'>;

interface CategoryExtraData {
  description?: string;
  imageName?: string;
  iconColor?: string;
}

interface DropdownResponseDto {
  id: string | number;
  name: string;
  extraData?: CategoryExtraData;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

interface CategoryCard {
  id: string | number;
  title: string;
  subtitle: string;
  icon: any;
  accentColor: string;
  badgeBg: string;
}

// Map server icon names/colors or provide sensible defaults
const getCategoryGraphic = (iconName?: string, hexColor?: string) => {
  const accentColor = hexColor || '#29B6F6';
  const badgeBg = hexColor ? `${hexColor}26` : 'rgba(41, 182, 246, 0.15)';

  let IconComponent = Sparkles;
  switch (iconName?.toLowerCase()) {
    case 'trending':
    case 'trendingup':
      IconComponent = TrendingUp;
      break;
    case 'home':
    case 'staying_home':
      IconComponent = Home;
      break;
    case 'heart':
    case 'hearticon':
    case 'preventive_care':
      IconComponent = HeartIcon;
      break;
    case 'flame':
    case 'must_have':
      IconComponent = Flame;
      break;
    default:
      IconComponent = Sparkles;
      break;
  }

  return { IconComponent, accentColor, badgeBg };
};

const CreateHabitScreen: React.FC<Props> = ({ navigation }) => {
  const [categories, setCategories] = useState<CategoryCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchCategories = useCallback(async (isRefreshingCall = false) => {
    if (isRefreshingCall) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    await getApi(
      habitCategoriesAPI,
      (res: ApiResponse<DropdownResponseDto[]>) => {
        if (res?.succeeded && Array.isArray(res.data)) {
          const formattedCategories: CategoryCard[] = res.data.map((item) => {
            const extra = item.extraData || {};
            const { IconComponent, accentColor, badgeBg } = getCategoryGraphic(
              extra.imageName,
              extra.iconColor
            );

            return {
              id: item.id,
              title: item.name,
              subtitle: extra.description || 'Discover and build new habits',
              icon: IconComponent,
              accentColor,
              badgeBg,
            };
          });

          setCategories(formattedCategories);
        } else {
          Alert.alert('Notice', res?.message || 'Failed to retrieve categories.');
        }
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (err:any) => {
        setIsLoading(false);
        setIsRefreshing(false);
        Alert.alert('Error', err?.message || 'Failed to connect to the server.');
      }
    );
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSelectRegularHabit = () => {
    navigation.navigate('CreateRegularHabit');
  };

  const handleSelectOneTimeTask = () => {
    navigation.navigate('CreateOneTimeHabit');
  };

  const handleSelectCategory = (categoryId: string | number, categoryName: string) => {
    // Navigating with category ID so the next screen can query habits by category ID
    navigation.navigate('CategoryHabitsList', {
      categoryId,
      categoryName,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* Header Card with Shadow & Close Button */}
      <View style={styles.headerShadowContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClose}
          style={styles.headerIconButton}
        >
          <X size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create habit</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCategories(true)}
            tintColor="#29B6F6"
          />
        }
      >
        {/* Top Type Selectors */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.typeCard}
          onPress={handleSelectRegularHabit}
        >
          <View style={[styles.typeIconBox, { backgroundColor: 'rgba(41, 182, 246, 0.15)' }]}>
            <CalendarDays size={moderateScale(24)} color="#29B6F6" />
          </View>
          <Text style={styles.typeTitle}>Regular habit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.typeCard}
          onPress={handleSelectOneTimeTask}
        >
          <View style={[styles.typeIconBox, { backgroundColor: 'rgba(255, 112, 67, 0.15)' }]}>
            <CheckSquare size={moderateScale(24)} color="#FF7043" />
          </View>
          <Text style={styles.typeTitle}>One-time task</Text>
        </TouchableOpacity>

        {/* Section Divider Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OR CHOOSE FROM THESE CATEGORIES</Text>
        </View>

        {/* Category Discovery List */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#29B6F6" />
          </View>
        ) : (
          categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.82}
                style={styles.categoryCard}
                onPress={() => handleSelectCategory(cat.id, cat.title)}
              >
                <View style={styles.categoryLeftText}>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  <Text style={styles.catSubtitle}>{cat.subtitle}</Text>
                </View>

                <View style={styles.categoryRightGraphic}>
                  <View style={[styles.graphicCircleBg, { backgroundColor: cat.badgeBg }]}>
                    <IconComponent size={moderateScale(30)} color={cat.accentColor} />
                  </View>
                  <ChevronRight
                    size={moderateScale(18)}
                    color="rgba(255, 255, 255, 0.3)"
                    style={styles.chevron}
                  />
                </View>
              </TouchableOpacity>
            );
          })
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

  /* Header */
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
    paddingBottom: scaleHeight(40),
  },

  // Primary Option Cards
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    marginBottom: scaleHeight(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  typeIconBox: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  typeTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeader: {
    marginTop: scaleHeight(14),
    marginBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(4),
  },
  sectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.1,
  },

  loaderContainer: {
    paddingVertical: scaleHeight(30),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Cards
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(18),
    paddingLeft: scaleWidth(18),
    paddingRight: scaleWidth(12),
    paddingVertical: scaleHeight(18),
    marginBottom: scaleHeight(12),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  categoryLeftText: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  catTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(4),
  },
  catSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: moderateScale(16),
  },
  categoryRightGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  graphicCircleBg: {
    width: scaleWidth(58),
    height: scaleWidth(58),
    borderRadius: scaleWidth(29),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: scaleWidth(6),
  },
});

export default CreateHabitScreen;