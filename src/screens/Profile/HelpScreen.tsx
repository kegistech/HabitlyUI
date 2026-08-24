// src/screens/Settings/HelpScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Globe, HelpCircle, ChevronRight } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/navigation';
import { scaleWidth, scaleHeight, moderateScale } from '../../styles/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

const EMAIL_ADDRESS = 'info@kegistech.com';
const WEBSITE_URL = 'https://www.kegistech.com';

const HelpScreen: React.FC<Props> = ({ navigation }) => {
  const handleOpenEmail = async () => {
    const mailtoUrl = `mailto:${EMAIL_ADDRESS}`;
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'Unable to open email client.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while trying to send an email.');
    }
  };

  const handleOpenWebsite = async () => {
    try {
      const canOpen = await Linking.canOpenURL(WEBSITE_URL);
      if (canOpen) {
        await Linking.openURL(WEBSITE_URL);
      } else {
        Alert.alert('Error', 'Unable to open browser.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while opening the website.');
    }
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

        <Text style={styles.headerTitle}>Help & Support</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Header Card */}
        <View style={styles.infoCard}>
          <View style={styles.helpIconCircle}>
            <HelpCircle size={moderateScale(26)} color="#29B6F6" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How can we help?</Text>
            <Text style={styles.infoSubtitle}>
              If you have any questions, feedback, or need assistance, feel free to reach out to us.
            </Text>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>CONTACT INFORMATION</Text>

          {/* Email Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.contactCard}
            onPress={handleOpenEmail}
          >
            <View style={styles.contactLeft}>
              <View style={styles.iconBox}>
                <Mail size={moderateScale(20)} color="#29B6F6" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Email Us</Text>
                <Text style={styles.contactValue}>{EMAIL_ADDRESS}</Text>
              </View>
            </View>
            <ChevronRight size={moderateScale(18)} color="#8E93A6" />
          </TouchableOpacity>

          {/* Website Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.contactCard}
            onPress={handleOpenWebsite}
          >
            <View style={styles.contactLeft}>
              <View style={styles.iconBox}>
                <Globe size={moderateScale(20)} color="#29B6F6" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Visit Website</Text>
                <Text style={styles.contactValue}>www.kegistech.com</Text>
              </View>
            </View>
            <ChevronRight size={moderateScale(18)} color="#8E93A6" />
          </TouchableOpacity>
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
  helpIconCircle: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(14),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scaleHeight(2),
  },
  infoSubtitle: {
    fontSize: moderateScale(12),
    color: '#8E93A6',
    lineHeight: moderateScale(16),
  },

  /* Section Styles */
  sectionContainer: {
    gap: scaleHeight(12),
  },
  sectionHeader: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#8E93A6',
    letterSpacing: 0.6,
    marginBottom: scaleHeight(4),
  },

  /* Contact Cards */
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#8E93A6',
    marginBottom: scaleHeight(2),
  },
  contactValue: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HelpScreen;