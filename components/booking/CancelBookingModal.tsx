import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface CancelBookingModalProps {
  visible: boolean;
  bookingReference: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function CancelBookingModal({
  visible,
  bookingReference,
  onClose,
  onConfirm,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const cancellationReasons = [
    'Change of plans',
    'Found better option',
    'Emergency',
    'Booking error',
    'Price too high',
    'Other',
  ];

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Cancel Booking</Text>
              <Text style={styles.headerSubtitle}>
                Booking: {bookingReference}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning */}
            <View style={styles.warningBox}>
              <AlertCircle size={20} color="#F87171" strokeWidth={2} />
              <Text style={styles.warningText}>
                This action cannot be undone. Please review the cancellation policy before proceeding.
              </Text>
            </View>

            {/* Cancellation Policy */}
            <View style={styles.policyBox}>
              <Text style={styles.policyTitle}>Cancellation Policy</Text>
              <Text style={styles.policyText}>
                • Free cancellation up to 24 hours before check-in
              </Text>
              <Text style={styles.policyText}>
                • 50% refund if cancelled within 24 hours
              </Text>
              <Text style={styles.policyText}>
                • No refund for no-shows
              </Text>
              <Text style={styles.policyText}>
                • Refund will be processed within 5-7 business days
              </Text>
            </View>

            {/* Reason Selection */}
            <Text style={styles.sectionLabel}>Reason for Cancellation *</Text>
            <View style={styles.reasonsContainer}>
              {cancellationReasons.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.reasonChip,
                    reason === item && styles.reasonChipSelected,
                  ]}
                  onPress={() => setReason(item)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      reason === item && styles.reasonChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason */}
            {reason === 'Other' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.sectionLabel}>Please specify</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your reason..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={reason === 'Other' ? '' : reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Keep Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!reason.trim() || loading) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!reason.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1f3a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F87171',
  },
  warningText: {
    flex: 1,
    fontSize: isSmallDevice ? 12 : 13,
    color: '#F87171',
    marginLeft: 12,
    lineHeight: 18,
  },
  policyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  policyTitle: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  policyText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#F87171',
  },
  reasonChipText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  reasonChipTextSelected: {
    color: '#F87171',
  },
  customReasonContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        paddingBottom: 30,
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
    color: '#fff',
  },
});
