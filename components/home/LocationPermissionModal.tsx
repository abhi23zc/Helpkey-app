import { MapPin, X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LocationPermissionModalProps {
  visible: boolean;
  onRequestPermission: () => void;
  onClose: () => void;
}

const LocationPermissionModal = ({
  visible,
  onRequestPermission,
  onClose,
}: LocationPermissionModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <MapPin size={48} color="#0066FF" />
          </View>

          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            Allow us to access your location to show nearby hotels and provide better recommendations.
          </Text>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={onRequestPermission}
          >
            <Text style={styles.allowButtonText}>Allow Location Access</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  allowButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default LocationPermissionModal;
