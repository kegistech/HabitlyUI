// src/components/AppModal.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { scaleWidth, scaleHeight, moderateScale } from '../styles/responsive';

export type ModalType = 'success' | 'warning' | 'error';

interface AppModalProps {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  buttonText?: string;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  buttonText = 'OK',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View
            style={[
              styles.modalIconContainer,
              type === 'success' && styles.successIconBg,
              type === 'warning' && styles.warningIconBg,
              type === 'error' && styles.errorIconBg,
            ]}
          >
            {type === 'success' && <CheckCircle2 size={36} color="#00E676" />}
            {type === 'warning' && <AlertTriangle size={36} color="#FFD700" />}
            {type === 'error' && <AlertCircle size={36} color="#FF5252" />}
          </View>

          <Text style={styles.modalTitleText}>{title}</Text>
          <Text style={styles.modalMessageText}>{message}</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.modalButton,
              type === 'success' && styles.successBtnBg,
              type === 'warning' && styles.warningBtnBg,
              type === 'error' && styles.errorBtnBg,
            ]}
            onPress={() => {
              onClose();
              if (onConfirm) {
                onConfirm();
              }
            }}
          >
            <Text style={styles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E222D',
    borderRadius: moderateScale(20),
    padding: scaleWidth(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalIconContainer: {
    width: scaleWidth(64),
    height: scaleWidth(64),
    borderRadius: scaleWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  successIconBg: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  warningIconBg: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  errorIconBg: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  modalTitleText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  modalMessageText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: scaleHeight(20),
    lineHeight: moderateScale(20),
  },
  modalButton: {
    width: '100%',
    height: scaleHeight(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnBg: {
    backgroundColor: '#00E676',
  },
  warningBtnBg: {
    backgroundColor: '#29B6F6',
  },
  errorBtnBg: {
    backgroundColor: '#FF5252',
  },
  modalButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});