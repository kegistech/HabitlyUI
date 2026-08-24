// src/screens/Profile/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ListTodo,
  Bell,
  Settings,
  Crown,
  LogOut,
  Pencil,
  ChevronRight,
} from 'lucide-react-native';

import AppLayout from '../AppLayout';
import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';
import { clearAuthToken } from '../../services/commonAPIs';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  // State for dynamic user profile data
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load user data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedUser = JSON.parse(storedUserData);

        if (parsedUser?.name) setUserName(parsedUser.name);
        if (parsedUser?.email) setUserEmail(parsedUser.email);
        if (parsedUser?.currentStreak !== undefined) {
          setCurrentStreak(parsedUser.currentStreak);
        }
      }
    } catch (error) {
      console.error('Error loading user data in profile:', error);
    }
  };

  // Sign Out Handler Logic
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Clear Authorization Token header & storage key
              await clearAuthToken();

              // 2. Clear stored user details
              await AsyncStorage.removeItem('userData');

              await AsyncStorage.removeItem('id');

              // 3. Reset navigation to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <AppLayout navigation={navigation} currentRoute="Profile" title="Profile">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Streak Hero Card */}
        {/* <View style={styles.streakHeroCard}>
          <View style={styles.streakInnerContent}>
            <Text style={styles.streakHeroSubtitle}>
              Start a new streak by completing habits
            </Text>
            <Text style={styles.streakHeroValue}>{currentStreak} days</Text>
            <Text style={styles.streakHeroLabel}>Your current streak</Text>
          </View>
        </View> */}

        {/* 2. User Info Card (Dynamic Name & Email) */}
        <View style={styles.profileCard}>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Pencil size={moderateScale(14)} color="#29B6F6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Menu Options List */}
        <View style={styles.menuCard}>
          {/* All Habits */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => navigation.navigate('AllHabits')}
          >
            <View style={styles.menuItemLeft}>
              <ListTodo size={moderateScale(22)} color="#29B6F6" />
              <Text style={styles.menuItemText}>All habits</Text>
            </View>
            <ChevronRight
              size={moderateScale(18)}
              color="rgba(255, 255, 255, 0.3)"
            />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={moderateScale(22)} color="#29B6F6" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <ChevronRight
              size={moderateScale(18)}
              color="rgba(255, 255, 255, 0.3)"
            />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.menuItemLeft}>
              <Settings size={moderateScale(22)} color="#29B6F6" />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <ChevronRight
              size={moderateScale(18)}
              color="rgba(255, 255, 255, 0.3)"
            />
          </TouchableOpacity>

          {/* Try for free / Pro Banner Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={styles.menuItemLeft}>
              <Crown size={moderateScale(22)} color="#FFB300" />
              <Text style={[styles.menuItemText, styles.proMenuText]}>
                Try for free
              </Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={moderateScale(22)} color="#FF5252" />
              <Text style={[styles.menuItemText, styles.signOutText]}>
                Sign out
              </Text>
            </View>
          </TouchableOpacity>
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

  /* Top Streak Hero Card */
  streakHeroCard: {
    backgroundColor: '#2558D8',
    borderRadius: moderateScale(20),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(18),
    marginBottom: scaleHeight(16),
  },
  streakInnerContent: {
    justifyContent: 'center',
  },
  streakHeroSubtitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scaleHeight(6),
  },
  streakHeroValue: {
    fontSize: moderateScale(32),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: moderateScale(38),
  },
  streakHeroLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: scaleHeight(4),
  },

  /* User Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: moderateScale(13),
    color: '#8E93A6',
    marginTop: scaleHeight(2),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: moderateScale(12),
    gap: scaleWidth(6),
  },
  editButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#29B6F6',
  },

  /* Menu List Container */
  menuCard: {
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    paddingVertical: scaleHeight(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(14),
  },
  menuItemText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Custom Item Colors */
  proMenuText: {
    color: '#FFB300',
  },
  proBadge: {
    backgroundColor: '#FFB300',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(3),
    borderRadius: moderateScale(6),
  },
  proBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#121212',
  },

  /* Sign Out Text */
  signOutText: {
    color: '#FF5252',
  },
});

export default ProfileScreen;