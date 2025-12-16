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
}

export default function SavedGuestSelector({
  visible,
  guests,
  onSelect,
  onClose
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
            <Text style={styles.title}>Select Saved Guest</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {guests && guests.length > 0 ? (
              guests.map((guest) => (
                <TouchableOpacity
                  key={guest.id}
                  style={styles.guestCard}
                  onPress={() => {
                    onSelect(guest);
                    onClose();
                  }}
                >
                  <View style={styles.guestInfo}>
                    <View style={styles.guestHeader}>
                      <Text style={styles.guestName}>
                        {guest.firstName} {guest.lastName || ''}
                      </Text>
                      {guest.aadhaarVerified && (
                        <View style={styles.verifiedBadge}>
                          <Shield size={12} color="#10B981" strokeWidth={2} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    {guest.phoneNumber && (
                      <Text style={styles.guestPhone}>{guest.phoneNumber}</Text>
                    )}
                    <Text style={styles.guestAadhaar}>
                      Aadhaar: XXXX XXXX {guest.aadhaarNumber.slice(-4)}
                    </Text>
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
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  guestCard: {
    backgroundColor: '#F9FAFB', // Light gray
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestInfo: {
    flex: 1,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  guestPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  guestAadhaar: {
    fontSize: 14,
    color: '#6B7280',
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
