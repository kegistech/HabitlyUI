// src/screens/Settings/ChangePasswordScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { postApi } from '../../services/commonAPIs';
import { changePasswordAPI } from '../../services/apiendpoints';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse<T = any> {
  succeeded: boolean;
  status: number;
  message?: string;
  data?: T;
}

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChangePassword = async () => {
    // Basic Form Validations
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Validation Error', 'New password cannot be the same as current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    const payload: ChangePasswordRequest = {
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    };

    setIsLoading(true);

    await postApi(
      changePasswordAPI,
      payload,
      (res: ApiResponse) => {
        setIsLoading(false);
        if (res?.succeeded) {
          Alert.alert('Success', res?.message || 'Password changed successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', res?.message || 'Failed to change password.');
        }
      },
      (err: any) => {
        setIsLoading(false);
        Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
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

        <Text style={styles.headerTitle}>Change Password</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Info Header */}
          <View style={styles.infoCard}>
            <View style={styles.lockIconCircle}>
              <Lock size={moderateScale(24)} color="#29B6F6" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Update Security</Text>
              <Text style={styles.infoSubtitle}>
                Choose a strong password with at least 8 characters.
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CURRENT PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#8E93A6"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.eyeIconButton}
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={moderateScale(20)} color="#8E93A6" />
                  ) : (
                    <Eye size={moderateScale(20)} color="#8E93A6" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#8E93A6"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.eyeIconButton}
                  onPress={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? (
                    <EyeOff size={moderateScale(20)} color="#8E93A6" />
                  ) : (
                    <Eye size={moderateScale(20)} color="#8E93A6" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#8E93A6"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.eyeIconButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={moderateScale(20)} color="#8E93A6" />
                  ) : (
                    <Eye size={moderateScale(20)} color="#8E93A6" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
            onPress={handleChangePassword}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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

  /* Content */
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(40),
  },

  /* Info Header Card */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: scaleHeight(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lockIconCircle: {
    width: scaleWidth(46),
    height: scaleWidth(46),
    borderRadius: scaleWidth(23),
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(14),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(2),
  },
  infoSubtitle: {
    fontSize: moderateScale(12),
    color: '#8E93A6',
    lineHeight: moderateScale(16),
  },

  /* Form Container */
  formContainer: {
    gap: scaleHeight(20),
    marginBottom: scaleHeight(32),
  },
  inputGroup: {},
  label: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#8E93A6',
    letterSpacing: 0.6,
    marginBottom: scaleHeight(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: scaleWidth(14),
  },
  input: {
    flex: 1,
    height: scaleHeight(50),
    fontSize: moderateScale(15),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eyeIconButton: {
    padding: scaleWidth(8),
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: '#29B6F6',
    height: scaleHeight(52),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ChangePasswordScreen;