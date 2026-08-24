// src/screens/Habits/CreateOneTimeHabit.tsx
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
import { X, Plus, Calendar, Clock, Trash2, Check } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOneTimeHabit'>;

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
  startDate?: string;
  reminders?: string[];
}

const CreateOneTimeHabitScreen: React.FC<Props> = ({ navigation, route }) => {

  const initialHabitData: HabitEditData | undefined = route.params?.habitData;

  const [habitName, setHabitName] = useState(route.params?.habitName || initialHabitData?.name || '');
  const [habitMasterId, setHabitMasterId] = useState<number| string | null>(
    route.params?.habitMasterId || initialHabitData?.habitMasterId || null
  );

  // Color selection state
  const [colors, setColors] = useState<DropdownResponseDto[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number>(initialHabitData?.colorCodeId || 0);
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#FF7043');
  const [isColorsLoading, setIsColorsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialHabitData?.startDate ? new Date(initialHabitData.startDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Reminders state
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(initialHabitData?.isSetReminder ?? true);
  const [reminders, setReminders] = useState<Date[]>([]);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [pickerTime, setPickerTime] = useState<Date>(new Date());

  // Fetch color codes on mount
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
          setSelectedColorHex(initialColor.codeOrSubTitle || '#FF7043');
        }
      },
      (err: any) => {
        setIsColorsLoading(false);
        Alert.alert('Error', err?.message || 'Failed to fetch colors.');
      }
    );
  };

  // Bind initial data when editing
  useEffect(() => {
    if (initialHabitData) {
      if (initialHabitData.name) setHabitName(initialHabitData.name);
      if (initialHabitData.habitMasterId) setHabitMasterId(initialHabitData.habitMasterId);
      if (initialHabitData.isSetReminder !== undefined) setRemindersEnabled(initialHabitData.isSetReminder);
      if (initialHabitData.startDate) setSelectedDate(new Date(initialHabitData.startDate));

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

  // Date picker handlers
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return isToday ? `Today, ${formattedDate}` : formattedDate;
  };

  // Reminder handlers
  const handleAddReminderPress = () => {
    setPickerTime(new Date());
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && date) {
      setReminders((prev) => [...prev, date]);
    }
  };

  const handleRemoveReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDisplayTime = (date: Date) => {
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
      Alert.alert('Validation Error', 'Please enter a habit name.');
      return;
    }

    const formattedReminders = remindersEnabled ? reminders.map(formatTimeOnly) : null;

    const payload: any = {
      name: habitName.trim(),
      description: '',
      habitMasterId: habitMasterId ? Number(habitMasterId) : null,
      colorCodeId: selectedColorId,
      valueOfHabit: 1,
      valueTypeId: ValueTypeEnum.NumberOfTimes,
      isSetReminder: remindersEnabled,
      goalTypeId: GoalTypeEnum.Daily,
      goalRepeatAmount: 1,
      goalOnSunday: false,
      goalOnMonday: false,
      goalOnTuesDay: false,
      goalOnWednessday: false,
      goalOnThursday: false,
      goalOnFriday: false,
      goalOnSaturday: false,
      habitType: HabitTypeEnum.OneTime,
      startDate: selectedDate.toISOString(),
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
            Alert.alert('Success', 'One-time task updated successfully.', [
              { text: 'OK', onPress: () => navigation.navigate('Dashboard')},
            ]);
          } else {
            Alert.alert('Error', res?.message || 'Failed to update task.');
          }
        },
        (err: any) => {
          setIsSubmitting(false);
          Alert.alert('Error', err?.message || 'An error occurred while updating.');
        }
      );
    } else {
      await postApi(
        habitAPI,
        payload,
        (res: ApiResponse<any>) => {
          setIsSubmitting(false);
          if (res?.succeeded) {
            Alert.alert('Success', 'One-time task created successfully.', [
              { text: 'OK', onPress: () => navigation.navigate('Dashboard')  },
            ]);
          } else {
            Alert.alert('Error', res?.message || 'Failed to create task.');
          }
        },
        (err: any) => {
          setIsSubmitting(false);
          Alert.alert('Error', err?.message || 'An error occurred while creating.');
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* Header */}
      <View style={styles.headerShadowContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
        >
          <X size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{initialHabitData?.id ? 'Edit task' : 'One-time task'}</Text>

        <TouchableOpacity activeOpacity={0.7} onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color={selectedColorHex} />
          ) : (
            <Text style={[styles.saveText, { color: selectedColorHex }]}>SAVE</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContentContainer}>
          {/* Task Name Input */}
          <View style={[styles.inputContainer, { borderBottomColor: selectedColorHex }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Name your habit"
              placeholderTextColor="#8E93A6"
              value={habitName}
              onChangeText={setHabitName}
            />
          </View>

          {/* Color Code Selection */}
          <View style={styles.colorSectionContainer}>
            <Text style={styles.sectionTitleLabel}>Select Color</Text>
            {isColorsLoading ? (
              <ActivityIndicator size="small" color={selectedColorHex} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsScroll}>
                {colors.map((colorItem) => {
                  const hexCode = colorItem.codeOrSubTitle || '#FF7043';
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

          {/* Date Picker Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.dateRow}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.dateLeft}>
              <Calendar size={moderateScale(22)} color={selectedColorHex} />
              <Text style={styles.dateText}>{formatDateLabel(selectedDate)}</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.divider} />

          {/* Reminders Toggle */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Get reminders</Text>
            <Switch
              trackColor={{ false: '#2C303E', true: selectedColorHex }}
              thumbColor={remindersEnabled ? '#FFFFFF' : '#8E93A6'}
              onValueChange={setRemindersEnabled}
              value={remindersEnabled}
            />
          </View>

          {/* Reminders List & Add Button */}
          {remindersEnabled && (
            <View style={styles.remindersWrapper}>
              {reminders.map((reminderTime, idx) => (
                <View key={idx} style={styles.reminderItemRow}>
                  <View style={styles.reminderItemLeft}>
                    <Clock size={moderateScale(18)} color={selectedColorHex} />
                    <Text style={styles.reminderTimeText}>{formatDisplayTime(reminderTime)}</Text>
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
                <Text style={[styles.addReminderText, { color: selectedColorHex }]}>Add reminder time</Text>
              </TouchableOpacity>
            </View>
          )}

          {showTimePicker && (
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(4),
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(14),
  },
  dateText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: scaleHeight(8),
    gap: scaleWidth(8),
  },
  addReminderText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});

export default CreateOneTimeHabitScreen;