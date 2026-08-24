// src/screens/WakeUpTime/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale, isTablet } from '../../styles/responsive';
import { putApi } from '../../services/commonAPIs';
import { updateWakeUpTimeAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'WakeUpTime'>;

const ITEM_HEIGHT = scaleHeight(50);

// Helper arrays for wheel picker values
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const WakeUpTimeScreen: React.FC<Props> = ({ navigation }) => {
  // Time selection state (Default: 08:00 AM)
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // FlatList Refs for programmatically setting scroll positions
  const hoursListRef = useRef<FlatList>(null);
  const minutesListRef = useRef<FlatList>(null);
  const periodsListRef = useRef<FlatList>(null);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Helper function to convert 12-hour time (e.g., 08:00 AM) to 24-hour TimeOnly string ("08:00:00")
  const formatToTimeOnly = (hourStr: string, minuteStr: string, periodStr: string): string => {
    let hour = parseInt(hourStr, 10);
    if (periodStr === 'PM' && hour < 12) {
      hour += 12;
    } else if (periodStr === 'AM' && hour === 12) {
      hour = 0;
    }
    const formattedHour = String(hour).padStart(2, '0');
    return `${formattedHour}:${minuteStr}:00`;
  };

  const handleContinue = () => {
    setErrorMessage('');
    const formattedTimeOnly = formatToTimeOnly(selectedHour, selectedMinute, selectedPeriod);

    const payload = {
      wakeUpTime: formattedTimeOnly,
    };

    setIsLoading(true);
    putApi(
      updateWakeUpTimeAPI,
      payload,
      (response: any) => {
        setIsLoading(false);
        if (response && (response.succeeded || response.isSuccess || response.status === 200)) {
          navigation.navigate('ReflectionTime');
        } else {
          setErrorMessage(response?.message || 'Failed to update wake-up time. Please try again.');
        }
      },
      (error: any) => {
        setIsLoading(false);
        const serverMsg =
          error?.response?.data?.message || error?.message || 'Network error occurred.';
        setErrorMessage(serverMsg);
      }
    );
  };

  // Wheel Scroll Handlers
  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    data: string[],
    setter: (val: string) => void
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < data.length) {
      setter(data[index]);
    }
  };

  const renderPickerColumn = (
    data: string[],
    selectedValue: string,
    onSelect: (val: string) => void,
    listRef: React.RefObject<FlatList>
  ) => {
    const initialIndex = data.indexOf(selectedValue);

    return (
      <View style={styles.columnContainer}>
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT, // Padding to center first and last items
          }}
          onMomentumScrollEnd={(e) => handleScroll(e, data, onSelect)}
          renderItem={({ item }) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    isSelected && styles.selectedPickerItemText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#312E81']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dynamic ambient glow behind the title */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Main Question Title & Badge */}
          <View style={styles.headerContainer}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>MORNING ROUTINE</Text>
            </View>

            <Text style={styles.questionText}>
              What time do you{'\n'}usually wake up? 🌅
            </Text>
            <Text style={styles.subText}>
              We'll use this to optimize your daily routine and schedule momentum alerts.
            </Text>
          </View>

          {/* Time Picker Wheel Section */}
          <View style={styles.pickerSectionContainer}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.pickerWrapper}>
              {/* Active Selection Glow Box */}
              <View style={styles.selectionHighlight} pointerEvents="none" />

              <View style={styles.pickerColumnsContainer}>
                {/* Hours Wheel */}
                {renderPickerColumn(HOURS, selectedHour, setSelectedHour, hoursListRef)}

                <Text style={styles.timeSeparator}>:</Text>

                {/* Minutes Wheel */}
                {renderPickerColumn(MINUTES, selectedMinute, setSelectedMinute, minutesListRef)}

                {/* AM / PM Wheel */}
                {renderPickerColumn(PERIODS, selectedPeriod, setSelectedPeriod, periodsListRef)}
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.continueButton}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.continueButtonText}>CONTINUE</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: scaleWidth(280),
    height: scaleWidth(280),
    borderRadius: 1000,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 70,
    elevation: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
    justifyContent: 'space-between',
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
  },

  // Header Section
  headerContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(20),
  },
  tagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: scaleHeight(16),
  },
  tagBadgeText: {
    color: '#34D399',
    fontSize: moderateScale(11),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  questionText: {
    fontSize: moderateScale(isTablet ? 36 : 28),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: moderateScale(isTablet ? 44 : 36),
    marginBottom: scaleHeight(12),
  },
  subText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    color: 'rgba(226, 232, 240, 0.75)',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    paddingHorizontal: scaleWidth(12),
  },

  // Picker Section Wrapper
  pickerSectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(16),
    width: '100%',
  },
  errorText: {
    color: '#F87171',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Time Picker Section
  pickerWrapper: {
    height: ITEM_HEIGHT * 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: scaleHeight(10),
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    width: '90%',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#34D399',
  },
  pickerColumnsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  columnContainer: {
    height: ITEM_HEIGHT * 3,
    width: scaleWidth(80),
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    color: 'rgba(226, 232, 240, 0.35)',
    fontSize: moderateScale(22),
    fontWeight: '600',
  },
  selectedPickerItemText: {
    color: '#34D399',
    fontSize: moderateScale(28),
    fontWeight: '900',
  },
  timeSeparator: {
    color: '#34D399',
    fontSize: moderateScale(26),
    fontWeight: '900',
    marginHorizontal: scaleWidth(4),
  },

  // Button Section
  bottomContainer: {
    marginBottom: scaleHeight(10),
    width: '100%',
  },
  continueButton: {
    width: '100%',
    height: scaleHeight(54),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default WakeUpTimeScreen;