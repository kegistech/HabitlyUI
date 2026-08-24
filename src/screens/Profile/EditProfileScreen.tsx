// src/screens/Profile/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, User, Globe, MapPin, Check, ChevronDown } from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { getApi, putApi } from '../../services/commonAPIs';
import { countriesAPI, statesAPI, editProfileAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

interface DropdownItem {
  label: string;
  value: number;
}

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  // --- Form State ---
  const [name, setName] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // --- Dropdown Options ---
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);

  // --- UI & Loading States ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Initial Data (User Data & Countries)
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsInitialLoading(true);

      // Fetch stored user details
      const storedUserData = await AsyncStorage.getItem('userData');
      let userData: any = null;
 
      if (storedUserData) {
        userData = JSON.parse(storedUserData);

        if (userData?.name) setName(userData.name);
      }

      const initialCountryId = userData?.countryId || null;
      const initialStateId = userData?.stateId || null;

      // Fetch Countries list using common getApi
      getApi(
        countriesAPI,
        async (response: any) => {
          const countryList: DropdownItem[] = (
            response?.data || response || []
          ).map((item: any) => ({
            label: item.name || item.countryName || item.label,
            value: item.id || item.countryId || item.value,
          }));

          setCountries(countryList);

          // Pre-select country & state if available
          if (initialCountryId) {
            setSelectedCountryId(initialCountryId);
            fetchStatesForCountry(initialCountryId, initialStateId);
          } else {
            setIsInitialLoading(false);
          }
        },
        (error: any) => {
          console.error('Error fetching countries:', error);
          setIsInitialLoading(false);
        }
      );
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setIsInitialLoading(false);
    }
  };

  // 2. Fetch States by Country ID using common getApi
  const fetchStatesForCountry = (countryId: number, initialStateIdToSet?: number | null) => {
    setIsStatesLoading(true);
    const endpoint = `${statesAPI}?countryId=${countryId}`;

    getApi(
      endpoint,
      (response: any) => {
        setIsStatesLoading(false);
        setIsInitialLoading(false);

        const stateList: DropdownItem[] = (
          response?.data || response || []
        ).map((item: any) => ({
          label: item.name || item.stateName || item.label,
          value: item.id || item.stateId || item.value,
        }));

        setStates(stateList);

        if (initialStateIdToSet) {
          setSelectedStateId(initialStateIdToSet);
        }
      },
      (error: any) => {
        console.error('Error fetching states:', error);
        setIsStatesLoading(false);
        setIsInitialLoading(false);
        setStates([]);
      }
    );
  };

  // 3. Handle Country Dropdown Change
  const handleCountryChange = (item: DropdownItem) => {
    setSelectedCountryId(item.value);
    setSelectedStateId(null);
    setStates([]);
    fetchStatesForCountry(item.value);
  };

  // 4. Save Profile Changes using common putApi
  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    const payload = {
      name: name.trim(),
      countryId: selectedCountryId,
      stateId: selectedStateId,
    };

    putApi(
      editProfileAPI,
      payload,
      async (response: any) => {
        setIsSaving(false);
        if (
          response &&
          (response.succeeded || response.isSuccess || response.status === 200 || response.data)
        ) {
          // Update cached user details in AsyncStorage
          const storedUserData = await AsyncStorage.getItem('userData');
          let parsedData = storedUserData ? JSON.parse(storedUserData) : {};

          const updatedUserData = {
            ...parsedData,
            name: payload.name,
            countryId: payload.countryId,
            stateId: payload.stateId,
          };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

          Alert.alert('Success', 'Profile updated successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          setErrorMessage(response?.message || 'Failed to update profile.');
        }
      },
      (error: any) => {
        setIsSaving(false);
        const serverMsg =
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred while saving profile.';
        setErrorMessage(serverMsg);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#161820" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#2558D8" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Inputs Container */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={moderateScale(18)} color="#8E93A6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor="#5C6070"
                  />
                </View>
              </View>

              {/* Country Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                <View style={styles.inputWrapper}>
                  <Globe size={moderateScale(18)} color="#8E93A6" style={styles.inputIcon} />
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                    activeColor="#2A2E3D"
                    data={countries}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Country"
                    value={selectedCountryId}
                    onChange={handleCountryChange}
                    renderRightIcon={() => (
                      <ChevronDown size={moderateScale(18)} color="#8E93A6" />
                    )}
                  />
                </View>
              </View>

              {/* State Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State / Region</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={moderateScale(18)} color="#8E93A6" style={styles.inputIcon} />
                  {isStatesLoading ? (
                    <ActivityIndicator size="small" color="#2558D8" style={styles.flexOne} />
                  ) : (
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.dropdownPlaceholder}
                      selectedTextStyle={styles.dropdownSelectedText}
                      containerStyle={styles.dropdownContainer}
                      itemTextStyle={styles.dropdownItemText}
                      activeColor="#2A2E3D"
                      data={states}
                      labelField="label"
                      valueField="value"
                      placeholder={selectedCountryId ? 'Select State' : 'Select Country First'}
                      value={selectedStateId}
                      disable={!selectedCountryId}
                      onChange={(item:any) => setSelectedStateId(item.value)}
                      renderRightIcon={() => (
                        <ChevronDown size={moderateScale(18)} color="#8E93A6" />
                      )}
                    />
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={moderateScale(20)} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161820',
  },
  flexOne: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
  },

  /* Error Banner */
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: scaleHeight(12),
    marginBottom: scaleHeight(16),
  },
  errorText: {
    color: '#F87171',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Form Container */
  formContainer: {
    gap: scaleHeight(20),
  },
  inputGroup: {
    gap: scaleHeight(8),
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#8E93A6',
    marginLeft: scaleWidth(4),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: scaleWidth(14),
    height: scaleHeight(52),
  },
  inputIcon: {
    marginRight: scaleWidth(10),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Dropdown Styling */
  dropdown: {
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: moderateScale(15),
    color: '#5C6070',
    fontWeight: '500',
  },
  dropdownSelectedText: {
    fontSize: moderateScale(15),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#1E222D',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(12),
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    backgroundColor: '#161820',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2558D8',
    borderRadius: moderateScale(16),
    height: scaleHeight(52),
    gap: scaleWidth(8),
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;