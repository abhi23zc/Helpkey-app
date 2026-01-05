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
                        <Shield size={12} color={guest.aadhaarVerified ? "#00D9FF" : "#F87171"} strokeWidth={2} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1f3a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 24,
    color: '#FFF',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  guestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guestCardVerified: {
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  guestCardUnverified: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
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
    color: '#FFF',
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
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  unverifiedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedText: {
    color: '#00D9FF',
  },
  unverifiedText: {
    color: '#F87171',
  },
  guestDetails: {
    marginBottom: 12,
  },
  guestPhone: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  guestAadhaar: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  benefitContainer: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  benefitText: {
    fontSize: 11,
    color: '#00D9FF',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 11,
    color: '#F87171',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  cancelButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
