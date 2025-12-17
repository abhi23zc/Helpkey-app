import { Shield } from 'lucide-react-native';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface SavedGuest {
  id: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  aadhaarNumber: string;
  aadhaarVerified?: boolean;
  aadhaarData?: any;
}

interface SavedGuestSelectorProps {
  visible: boolean;
  guests: SavedGuest[];
  onSelect: (guest: SavedGuest) => void;
  onClose: () => void;
  guestIndex?: number;
}

export default function SavedGuestSelector({
  visible,
  guests,
  onSelect,
  onClose,
  guestIndex = 0
}: SavedGuestSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Saved Guest</Text>
              <Text style={styles.subtitle}>
                For {guestIndex === 0 ? 'Primary Guest' : `Guest ${guestIndex + 1}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {guests && guests.length > 0 ? (
              guests.map((guest) => (
                <TouchableOpacity
                  key={guest.id}
                  style={[
                    styles.guestCard,
                    guest.aadhaarVerified ? styles.guestCardVerified : styles.guestCardUnverified
                  ]}
                  onPress={() => {
                    onSelect(guest);
                  }}
                >
                  <View style={styles.guestInfo}>
                    <View style={styles.guestHeader}>
                      <Text style={styles.guestName}>
                        {guest.firstName} {guest.lastName || ''}
                      </Text>
                      <View style={[
                        styles.verificationBadge,
                        guest.aadhaarVerified ? styles.verifiedBadge : styles.unverifiedBadge
                      ]}>
                        <Shield size={12} color={guest.aadhaarVerified ? "#059669" : "#DC2626"} strokeWidth={2} />
                        <Text style={[
                          styles.verificationText,
                          guest.aadhaarVerified ? styles.verifiedText : styles.unverifiedText
                        ]}>
                          {guest.aadhaarVerified ? 'Verified' : 'Not Verified'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.guestDetails}>
                      {guest.phoneNumber && (
                        <Text style={styles.guestPhone}>📱 {guest.phoneNumber}</Text>
                      )}
                      <Text style={styles.guestAadhaar}>
                        🆔 Aadhaar: XXXX XXXX {guest.aadhaarNumber.slice(-4)}
                      </Text>
                    </View>

                    {guest.aadhaarVerified ? (
                      <View style={styles.benefitContainer}>
                        <Text style={styles.benefitText}>✅ Ready for pre-checkin</Text>
                      </View>
                    ) : (
                      <View style={styles.warningContainer}>
                        <Text style={styles.warningText}>⚠️ Verification required for pre-checkin</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No saved guests found</Text>
                <Text style={styles.emptySubtext}>
                  Add guests in your profile to use this feature
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  guestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestCardVerified: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  guestCardUnverified: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  guestInfo: {
    flex: 1,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#059669',
  },
  unverifiedBadge: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedText: {
    color: '#059669',
  },
  unverifiedText: {
    color: '#DC2626',
  },
  guestDetails: {
    marginBottom: 12,
  },
  guestPhone: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  guestAadhaar: {
    fontSize: 13,
    color: '#374151',
  },
  benefitContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  benefitText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  cancelButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
});
