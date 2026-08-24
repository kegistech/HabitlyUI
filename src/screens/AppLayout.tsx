// src/components/AppLayout.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  BarChart3,
  User as UserIcon,
  ArrowLeft,
  Crown,
} from 'lucide-react-native';



export type RouteType = 'Dashboard' | 'Stats' | 'Profile';

interface AppLayoutProps {
  children: React.ReactNode;
  navigation: any;
  currentRoute: RouteType;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  navigation,
  currentRoute,
  title,
  showBack,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  const handleBackAction = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleProPress = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top SafeArea Spacer */}
      <View style={{ height: insets.top, backgroundColor: '#1D2124' }} />

      {/* PERSISTENT HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity onPress={handleBackAction} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || currentRoute}
          </Text>
        </View>

        {/* PRO Yellow Button (Right Side) */}
        <TouchableOpacity
          style={styles.proBadgeBtn}
          activeOpacity={0.8}
          onPress={handleProPress}
        >
          <Crown size={15} color="#FFD700" style={styles.crownIcon} />
          <Text style={styles.proText}>TRY PRO</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.content}>{children}</View>

      {/* PERSISTENT BOTTOM TAB BAR */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 10,
          },
        ]}
      >
        {/* 1. Today / Dashboard */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <View style={[styles.iconWrapper, currentRoute === 'Dashboard' && styles.activeIconWrapper]}>
            <Calendar
              size={22}
              color={currentRoute === 'Dashboard' ? '#00E676' : 'rgba(255, 255, 255, 0.4)'}
            />
          </View>
          <Text style={[styles.navText, currentRoute === 'Dashboard' && styles.activeNavText]}>
            Today
          </Text>
        </TouchableOpacity>

        {/* 2. Stats */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Stats')}
        >
          <View style={[styles.iconWrapper, currentRoute === 'Stats' && styles.activeIconWrapper]}>
            <BarChart3
              size={22}
              color={currentRoute === 'Stats' ? '#00E676' : 'rgba(255, 255, 255, 0.4)'}
            />
          </View>
          <Text style={[styles.navText, currentRoute === 'Stats' && styles.activeNavText]}>
            Stats
          </Text>
        </TouchableOpacity>

        {/* 3. Profile */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.iconWrapper, currentRoute === 'Profile' && styles.activeIconWrapper]}>
            <UserIcon
              size={22}
              color={currentRoute === 'Profile' ? '#00E676' : 'rgba(255, 255, 255, 0.4)'}
            />
          </View>
          <Text style={[styles.navText, currentRoute === 'Profile' && styles.activeNavText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#1D2124',
  },

  // Header Styles
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1D2124',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // PRO Badge
  proBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  crownIcon: {
    marginRight: 5,
  },
  proText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Content Area
  content: {
    flex: 1,
    backgroundColor: '#1D2124',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#16191C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 3,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  navText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.4,
  },
  activeNavText: {
    color: '#00E676',
    fontWeight: '900',
  },
});

export default AppLayout;