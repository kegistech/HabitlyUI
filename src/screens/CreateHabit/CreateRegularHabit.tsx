// src/screens/Habits/CreateRegularHabit.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, Check, Plus, Trash2, Clock } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi, postApi, putApi } from '../../services/commonAPIs';
import { colorCodesAPI, habitAPI } from '../../services/apiendpoints';

export enum ValueTypeEnum {
  NumberOfTimes = 1,
  TimeInMinutes = 2,
}

export enum GoalTypeEnum {
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
}

export enum HabitTypeEnum {
  Regular = 1,
  OneTime = 2,
}

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRegularHabit'>;

interface DropdownResponseDto {
  id: number;
  name: string;
  codeOrSubTitle?: string;
}

interface ApiResponse<T> {
  succeeded: boolean;
  status: number;
  message?: string;
  data: T;
}

interface HabitEditData {
  id?: number;
  name: string;
  description?: string;
  habitMasterId?: number | null;
  colorCodeId: number;
  valueOfHabit: number;
  valueTypeId: ValueTypeEnum;
  isSetReminder: boolean;
  goalTypeId: GoalTypeEnum;
  goalRepeatAmount: number;
  goalOnSunday: boolean;
  goalOnMonday: boolean;
  goalOnTuesDay: boolean;
  goalOnWednessday: boolean;
  goalOnThursday: boolean;
  goalOnFriday: boolean;
  goalOnSaturday: boolean;
  startDate?: string;
  reminders?: string[];
}

const WEEKLY_OPTIONS = ['1', '2', '3', '4', '5', '6'];
const MONTHLY_OPTIONS = ['1', '2', '3'];

const CreateRegularHabit: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();

  const initialHabitData: HabitEditData | undefined = route.params?.habitData;

  const [habitName, setHabitName] = useState(route.params?.habitName || initialHabitData?.name || '');
  const [habitMasterId, setHabitMasterId] = useState<number | string | null>(
    route.params?.habitMasterId || initialHabitData?.habitMasterId || null
  );

  const [valueType, setValueType] = useState<ValueTypeEnum>(
    initialHabitData?.valueTypeId ?? ValueTypeEnum.NumberOfTimes
  );
  const [goalValue, setGoalValue] = useState<string>(
    initialHabitData?.valueOfHabit ? String(initialHabitData.valueOfHabit) : '1'
  );

  const [colors, setColors] = useState<DropdownResponseDto[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number>(initialHabitData?.colorCodeId || 0);
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#1E88E5');
  const [isColorsLoading, setIsColorsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [goalTypeId, setGoalTypeId] = useState<GoalTypeEnum>(
    initialHabitData?.goalTypeId ?? GoalTypeEnum.Daily
  );
  const [repeatEveryDay, setRepeatEveryDay] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [goalRepeatAmount, setGoalRepeatAmount] = useState<number>(initialHabitData?.goalRepeatAmount || 1);

  const [selectedTimesOfDay, setSelectedTimesOfDay] = useState<string[]>([]);

  const [remindersEnabled, setRemindersEnabled] = useState(initialHabitData?.isSetReminder ?? false);
  const [reminders, setReminders] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerTime, setPickerTime] = useState<Date>(new Date());

  const dailyDays = [
    t('createRegularHabit.daysOfWeek.sunday'),
    t('createRegularHabit.daysOfWeek.monday'),
    t('createRegularHabit.daysOfWeek.tuesday'),
    t('createRegularHabit.daysOfWeek.wednesday'),
    t('createRegularHabit.daysOfWeek.thursday'),
    t('createRegularHabit.daysOfWeek.friday'),
    t('createRegularHabit.daysOfWeek.saturday'),
  ];

  const frequencies: { label: string; value: GoalTypeEnum }[] = [
    { label: t('createRegularHabit.frequencies.daily'), value: GoalTypeEnum.Daily },
    { label: t('createRegularHabit.frequencies.weekly'), value: GoalTypeEnum.Weekly },
    { label: t('createRegularHabit.frequencies.monthly'), value: GoalTypeEnum.Monthly },
  ];

  const timeOfDayList = [
    { key: 'Morning', label: t('createRegularHabit.timesOfDay.morning') },
    { key: 'Afternoon', label: t('createRegularHabit.timesOfDay.afternoon') },
    { key: 'Evening', label: t('createRegularHabit.timesOfDay.evening') },
  ];

  // Fetch color codes and bind edit data
  useEffect(() => {
    fetchColorCodes();
  }, []);

  const fetchColorCodes = async () => {
    setIsColorsLoading(true);
    await getApi(
      colorCodesAPI,
      (res: ApiResponse<DropdownResponseDto[]>) => {
        setIsColorsLoading(false);
        if (res?.succeeded && Array.isArray(res.data) && res.data.length > 0) {
          setColors(res.data);

          let initialColor = res.data[0];
          if (initialHabitData?.colorCodeId) {
            const matchedColor = res.data.find((c) => Number(c.id) === initialHabitData.colorCodeId);
            if (matchedColor) initialColor = matchedColor;
          }

          setSelectedColorId(Number(initialColor.id));
          setSelectedColorHex(initialColor.codeOrSubTitle || '#1E88E5');
        }
      },
      (err: any) => {
        setIsColorsLoading(false);
        Alert.alert(
          t('createRegularHabit.alerts.errorTitle'),
          err?.message || t('createRegularHabit.alerts.fetchColorsFailed')
        );
      }
    );
  };

  // Bind existing habit values if editing
  useEffect(() => {
    if (initialHabitData) {
      if (initialHabitData.name) setHabitName(initialHabitData.name);
      if (initialHabitData.habitMasterId) setHabitMasterId(initialHabitData.habitMasterId);
      if (initialHabitData.valueOfHabit) setGoalValue(String(initialHabitData.valueOfHabit));
      if (initialHabitData.valueTypeId) setValueType(initialHabitData.valueTypeId);
      if (initialHabitData.isSetReminder !== undefined) setRemindersEnabled(initialHabitData.isSetReminder);
      if (initialHabitData.goalTypeId) setGoalTypeId(initialHabitData.goalTypeId);
      if (initialHabitData.goalRepeatAmount) setGoalRepeatAmount(initialHabitData.goalRepeatAmount);

      if (initialHabitData.goalTypeId === GoalTypeEnum.Daily) {
        const days: number[] = [];
        if (initialHabitData.goalOnSunday) days.push(0);
        if (initialHabitData.goalOnMonday) days.push(1);
        if (initialHabitData.goalOnTuesDay) days.push(2);
        if (initialHabitData.goalOnWednessday) days.push(3);
        if (initialHabitData.goalOnThursday) days.push(4);
        if (initialHabitData.goalOnFriday) days.push(5);
        if (initialHabitData.goalOnSaturday) days.push(6);
        setSelectedDays(days);
        setRepeatEveryDay(days.length === 7);
      }

      if (initialHabitData.reminders && initialHabitData.reminders.length > 0) {
        const parsedReminders = initialHabitData.reminders.map((timeStr) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date;
        });
        setReminders(parsedReminders);
      }
    }
  }, [initialHabitData]);

  const handleFrequencyChange = (type: GoalTypeEnum) => {
    setGoalTypeId(type);
    if (type === GoalTypeEnum.Daily) {
      setRepeatEveryDay(true);
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setGoalRepeatAmount(1);
    } else {
      setGoalRepeatAmount(1);
    }
  };

  const toggleDay = (index: number) => {
    let updatedDays: number[];
    if (selectedDays.includes(index)) {
      updatedDays = selectedDays.filter((d) => d !== index);
    } else {
      updatedDays = [...selectedDays, index];
    }
    setSelectedDays(updatedDays);
    setRepeatEveryDay(updatedDays.length === dailyDays.length);
  };

  const handleRepeatEveryDayToggle = () => {
    const nextState = !repeatEveryDay;
    setRepeatEveryDay(nextState);
    setSelectedDays(nextState ? [0, 1, 2, 3, 4, 5, 6] : []);
  };

  const toggleTimeOfDay = (timeKey: string) => {
    if (selectedTimesOfDay.includes(timeKey)) {
      setSelectedTimesOfDay(selectedTimesOfDay.filter((t) => t !== timeKey));
    } else {
      setSelectedTimesOfDay([...selectedTimesOfDay, timeKey]);
    }
  };

  const handleAddReminderPress = () => {
    setPickerTime(new Date());
    setShowPicker(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) {
      setReminders((prev) => [...prev, date]);
    }
  };

  const handleRemoveReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatTimeOnly = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert(
        t('createRegularHabit.alerts.validationTitle'),
        t('createRegularHabit.alerts.enterHabitName')
      );
      return;
    }

    const formattedReminders = remindersEnabled ? reminders.map(formatTimeOnly) : null;
    const isDaily = goalTypeId === GoalTypeEnum.Daily;

    const payload: any = {
      name: habitName.trim(),
      description: '',
      habitMasterId: habitMasterId ? Number(habitMasterId) : null,
      colorCodeId: selectedColorId,
      valueOfHabit: Number(goalValue) || 1,
      valueTypeId: valueType,
      isSetReminder: remindersEnabled,
      goalTypeId: goalTypeId,
      goalRepeatAmount: isDaily ? 1 : goalRepeatAmount,
      goalOnSunday: isDaily ? selectedDays.includes(0) : false,
      goalOnMonday: isDaily ? selectedDays.includes(1) : false,
      goalOnTuesDay: isDaily ? selectedDays.includes(2) : false,
      goalOnWednessday: isDaily ? selectedDays.includes(3) : false,
      goalOnThursday: isDaily ? selectedDays.includes(4) : false,
      goalOnFriday: isDaily ? selectedDays.includes(5) : false,
      goalOnSaturday: isDaily ? selectedDays.includes(6) : false,
      habitType: HabitTypeEnum.Regular,
      startDate: new Date().toISOString(),
      reminders: formattedReminders,
    };

    setIsSubmitting(true);

    if (initialHabitData) {
      payload.id = initialHabitData?.id;
      await putApi(
        habitAPI,
        payload,
        (res: ApiResponse<any>) => {
          setIsSubmitting(false);
          if (res?.succeeded) {
            Alert.alert(
              t('createRegularHabit.alerts.successTitle'),
              t('createRegularHabit.alerts.habitUpdatedSuccess'),
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard', { review: 1 }) }]
            );
          } else {
            Alert.alert(
              t('createRegularHabit.alerts.errorTitle'),
              res?.message || t('createRegularHabit.alerts.habitUpdateFailed')
            );
          }
        },
        (err: any) => {
          setIsSubmitting(false);
          Alert.alert(
            t('createRegularHabit.alerts.errorTitle'),
            err?.message || t('createRegularHabit.alerts.updateError')
          );
        }
      );
    } else {
      await postApi(
        habitAPI,
        payload,
        (res: ApiResponse<any>) => {
          setIsSubmitting(false);
          if (res?.succeeded) {
            Alert.alert(
              t('createRegularHabit.alerts.successTitle'),
              t('createRegularHabit.alerts.habitCreatedSuccess'),
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard', { review: 1 }) }]
            );
          } else {
            Alert.alert(
              t('createRegularHabit.alerts.errorTitle'),
              res?.message || t('createRegularHabit.alerts.habitCreateFailed')
            );
          }
        },
        (err: any) => {
          setIsSubmitting(false);
          Alert.alert(
            t('createRegularHabit.alerts.errorTitle'),
            err?.message || t('createRegularHabit.alerts.createError')
          );
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* Header */}
      <View style={styles.headerShadowContainer}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <X size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {initialHabitData
            ? t('createRegularHabit.headerTitleEdit')
            : t('createRegularHabit.headerTitleNew')}
        </Text>

        <TouchableOpacity activeOpacity={0.7} onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color={selectedColorHex} />
          ) : (
            <Text style={[styles.saveText, { color: selectedColorHex }]}>
              {t('createRegularHabit.save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContentContainer}>
          {/* Habit Name Input */}
          <View style={[styles.inputContainer, { borderBottomColor: selectedColorHex }]}>
            <TextInput
              style={styles.textInput}
              placeholder={t('createRegularHabit.placeholderName')}
              placeholderTextColor="#8E93A6"
              value={habitName}
              onChangeText={setHabitName}
            />
          </View>

          {/* Color Selection */}
          <View style={styles.colorSectionContainer}>
            <Text style={styles.sectionTitleLabel}>{t('createRegularHabit.selectColor')}</Text>
            {isColorsLoading ? (
              <ActivityIndicator size="small" color="#1E88E5" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsScroll}>
                {colors.map((colorItem) => {
                  const hexCode = colorItem.codeOrSubTitle || '#1E88E5';
                  const isSelected = selectedColorId === Number(colorItem.id);

                  return (
                    <TouchableOpacity
                      key={colorItem.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedColorId(Number(colorItem.id));
                        setSelectedColorHex(hexCode);
                      }}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: hexCode },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                    >
                      {isSelected && <Check size={moderateScale(16)} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.divider} />

          {/* Goal Section */}
          <View style={styles.goalContainer}>
            <Text style={styles.sectionTitle}>{t('createRegularHabit.goalForHabit')}</Text>

            <View style={styles.enumToggleContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.enumChip,
                  valueType === ValueTypeEnum.NumberOfTimes && { backgroundColor: selectedColorHex },
                ]}
                onPress={() => setValueType(ValueTypeEnum.NumberOfTimes)}
              >
                <Text style={styles.enumChipText}>{t('createRegularHabit.numberOfTimes')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.enumChip,
                  valueType === ValueTypeEnum.TimeInMinutes && { backgroundColor: selectedColorHex },
                ]}
                onPress={() => setValueType(ValueTypeEnum.TimeInMinutes)}
              >
                <Text style={styles.enumChipText}>{t('createRegularHabit.time')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goalInputWrapper}>
              <TextInput
                style={styles.goalInput}
                keyboardType="numeric"
                value={goalValue}
                onChangeText={setGoalValue}
                placeholder="1"
                placeholderTextColor="#8E93A6"
              />
              <Text style={styles.goalInputSuffix}>
                {valueType === ValueTypeEnum.NumberOfTimes
                  ? t('createRegularHabit.timesSuffix')
                  : t('createRegularHabit.minutesSuffix')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Frequency Options */}
          <View style={styles.frequencyRow}>
            {frequencies.map((item) => (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.8}
                style={[
                  styles.frequencyChip,
                  goalTypeId === item.value && { backgroundColor: selectedColorHex },
                ]}
                onPress={() => handleFrequencyChange(item.value)}
              >
                <Text style={styles.frequencyText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {goalTypeId === GoalTypeEnum.Daily && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>{t('createRegularHabit.repeatEveryDay')}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRepeatEveryDayToggle}
                  style={[
                    styles.checkbox,
                    repeatEveryDay && { backgroundColor: selectedColorHex, borderColor: selectedColorHex },
                  ]}
                >
                  {repeatEveryDay && <Check size={moderateScale(14)} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                {dailyDays.map((day, index) => {
                  const isSelected = selectedDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={[
                        styles.circleOption,
                        isSelected && { backgroundColor: selectedColorHex },
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={styles.optionText}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {goalTypeId === GoalTypeEnum.Weekly && (
            <View style={styles.optionsRow}>
              {WEEKLY_OPTIONS.map((val) => {
                const isSelected = goalRepeatAmount === Number(val);
                return (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    style={[
                      styles.circleOption,
                      isSelected && { backgroundColor: selectedColorHex },
                    ]}
                    onPress={() => setGoalRepeatAmount(Number(val))}
                  >
                    <Text style={styles.optionText}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {goalTypeId === GoalTypeEnum.Monthly && (
            <View style={styles.optionsRow}>
              {MONTHLY_OPTIONS.map((val) => {
                const isSelected = goalRepeatAmount === Number(val);
                return (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    style={[
                      styles.circleOption,
                      isSelected && { backgroundColor: selectedColorHex },
                    ]}
                    onPress={() => setGoalRepeatAmount(Number(val))}
                  >
                    <Text style={styles.optionText}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.divider} />

          {/* Repeat Daily In */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('createRegularHabit.repeatDailyIn')}</Text>
          </View>

          <View style={styles.timeOfDayRow}>
            {timeOfDayList.map((time) => {
              const isSelected = selectedTimesOfDay.includes(time.key);
              return (
                <TouchableOpacity
                  key={time.key}
                  activeOpacity={0.8}
                  style={[
                    styles.timeChip,
                    isSelected && { backgroundColor: selectedColorHex },
                  ]}
                  onPress={() => toggleTimeOfDay(time.key)}
                >
                  <Text style={styles.timeChipText}>{time.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Reminders Toggle */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('createRegularHabit.getReminders')}</Text>
            <Switch
              trackColor={{ false: '#2C303E', true: selectedColorHex }}
              thumbColor={remindersEnabled ? '#FFFFFF' : '#8E93A6'}
              onValueChange={setRemindersEnabled}
              value={remindersEnabled}
            />
          </View>

          {remindersEnabled && (
            <View style={styles.remindersWrapper}>
              {reminders.map((reminderTime, idx) => (
                <View key={idx} style={styles.reminderItemRow}>
                  <View style={styles.reminderItemLeft}>
                    <Clock size={moderateScale(18)} color={selectedColorHex} />
                    <Text style={styles.reminderTimeText}>{formatTime(reminderTime)}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRemoveReminder(idx)}
                    style={styles.deleteReminderBtn}
                  >
                    <Trash2 size={moderateScale(18)} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.addReminderBtn}
                onPress={handleAddReminderPress}
              >
                <Plus size={moderateScale(18)} color={selectedColorHex} strokeWidth={2.5} />
                <Text style={[styles.addReminderText, { color: selectedColorHex }]}>
                  {t('createRegularHabit.addReminderTime')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showPicker && (
            <DateTimePicker
              value={pickerTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
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
  saveText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(12),
    paddingTop: scaleHeight(4),
    paddingBottom: scaleHeight(24),
  },
  cardContentContainer: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(18),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(18),
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
  inputContainer: {
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: 2,
    marginBottom: scaleHeight(16),
  },
  textInput: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#FFFFFF',
    padding: 0,
  },
  colorSectionContainer: {
    marginVertical: scaleHeight(4),
  },
  sectionTitleLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#8E93A6',
    marginBottom: scaleHeight(10),
  },
  colorsScroll: {
    gap: scaleWidth(12),
    alignItems: 'center',
  },
  colorSwatch: {
    width: scaleWidth(38),
    height: scaleWidth(38),
    borderRadius: scaleWidth(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: scaleHeight(18),
  },
  goalContainer: {
    gap: scaleHeight(12),
  },
  enumToggleContainer: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  enumChip: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(20),
    alignItems: 'center',
  },
  enumChipText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
  },
  goalInput: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    padding: 0,
  },
  goalInputSuffix: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#8E93A6',
    marginLeft: scaleWidth(8),
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkbox: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: '#42485A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
    marginBottom: scaleHeight(18),
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(24),
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(16),
  },
  circleOption: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    borderRadius: scaleWidth(21),
    backgroundColor: '#272C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeOfDayRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
    marginTop: scaleHeight(14),
  },
  timeChip: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(18),
    backgroundColor: '#272C3A',
    borderRadius: moderateScale(24),
  },
  timeChipText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  remindersWrapper: {
    marginTop: scaleHeight(12),
  },
  reminderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#272C3A',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: moderateScale(10),
    marginBottom: scaleHeight(8),
  },
  reminderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  reminderTimeText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteReminderBtn: {
    padding: scaleWidth(4),
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(6),
    gap: scaleWidth(8),
  },
  addReminderText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});

export default CreateRegularHabit;