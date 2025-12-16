import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, Shield, Eye, User, Phone, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import AadhaarVerificationModal from '@/components/AadhaarVerificationModal';
import GuestDetailsModal from '@/components/GuestDetailsModal';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SavedGuest {
  id: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  aadhaarNumber: string;
  aadhaarVerified?: boolean;
  aadhaarData?: any;
}

export default function SavedGuestsScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [savedGuests, setSavedGuests] = useState<SavedGuest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<SavedGuest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    aadhaarNumber: ''
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingGuest, setVerifyingGuest] = useState<SavedGuest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<SavedGuest | null>(null);

  useEffect(() => {
    if (userData?.savedGuests) {
      setSavedGuests(userData.savedGuests);
    }
  }, [userData]);

  const handleAddGuest = () => {
    setGuestForm({ firstName: '', lastName: '', phoneNumber: '', aadhaarNumber: '' });
    setEditingGuest(null);
    setShowAddModal(true);
  };

  const handleEditGuest = (guest: SavedGuest) => {
    setEditingGuest(guest);
    setGuestForm({
      firstName: guest.firstName,
      lastName: guest.lastName || '',
      phoneNumber: guest.phoneNumber || '',
      aadhaarNumber: guest.aadhaarNumber
    });
    setShowAddModal(true);
  };

  const handleSaveGuest = async () => {
    if (!user?.uid) return;

    if (!guestForm.firstName.trim() || !guestForm.aadhaarNumber.trim()) {
      Alert.alert('Required', 'First name and Aadhaar number are required');
      return;
    }

    const aadhaarDigits = guestForm.aadhaarNumber.replace(/\s/g, '');
    if (aadhaarDigits.length !== 12) {
      Alert.alert('Invalid', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsSubmitting(true);

    try {
      const newGuest: SavedGuest = {
        id: editingGuest?.id || Date.now().toString(),
        firstName: guestForm.firstName.trim(),
        aadhaarNumber: aadhaarDigits,
        ...(guestForm.lastName.trim() && { lastName: guestForm.lastName.trim() }),
        ...(guestForm.phoneNumber.trim() && { phoneNumber: guestForm.phoneNumber.trim() })
      };

      let updatedGuests: SavedGuest[];
      if (editingGuest) {
        updatedGuests = savedGuests.map(g => g.id === editingGuest.id ? newGuest : g);
      } else {
        updatedGuests = [...savedGuests, newGuest];
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { savedGuests: updatedGuests });

      setSavedGuests(updatedGuests);
      setShowAddModal(false);
      Alert.alert('Success', editingGuest ? 'Guest updated successfully' : 'Guest added successfully');
    } catch (error) {
      console.error('Error saving guest:', error);
      Alert.alert('Error', 'Failed to save guest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = (guestId: string) => {
    Alert.alert(
      'Delete Guest',
      'Are you sure you want to delete this guest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              const updatedGuests = savedGuests.filter(g => g.id !== guestId);
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { savedGuests: updatedGuests });
              setSavedGuests(updatedGuests);
            } catch (error) {
              console.error('Error deleting guest:', error);
              Alert.alert('Error', 'Failed to delete guest');
            }
          }
        }
      ]
    );
  };

  const handleVerifyGuest = (guest: SavedGuest) => {
    setVerifyingGuest(guest);
    setShowVerificationModal(true);
  };

  const handleShowDetails = (guest: SavedGuest) => {
    setSelectedGuest(guest);
    setShowDetailsModal(true);
  };

  const handleVerificationSuccess = async (verificationData: any) => {
    if (!user?.uid || !verifyingGuest) return;

    try {
      const updatedGuest = {
        ...verifyingGuest,
        aadhaarVerified: true,
        aadhaarData: {
          fullName: verificationData.verificationData?.name || verifyingGuest.firstName,
          dateOfBirth: verificationData.verificationData?.dob || '',
          address: verificationData.verificationData?.address || '',
          phoneNumber: verificationData.verificationData?.mobile_hash || '',
          verifiedAt: verificationData.verifiedAt,
          gender: verificationData.verificationData?.gender,
          photo: verificationData.verificationData?.photo,
          careOf: verificationData.verificationData?.careOf,
          email: verificationData.verificationData?.email,
          rawCashfreeResponse: verificationData.verificationData?.rawCashfreeResponse,
        }
      };

      const updatedGuests = savedGuests.map(g =>
        g.id === verifyingGuest.id ? updatedGuest : g
      );

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { savedGuests: updatedGuests });

      setSavedGuests(updatedGuests);
      setShowVerificationModal(false);
      Alert.alert('Success', `Aadhaar verified successfully for ${verifyingGuest.firstName}!`);
    } catch (error) {
      console.error('Error saving verification:', error);
      Alert.alert('Error', 'Failed to save verification. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Guests</Text>
        <TouchableOpacity
          onPress={handleAddGuest}
          style={styles.addButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={24} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 } as any}
          style={styles.infoCard}
        >
          <View style={styles.infoIconContainer}>
            <Shield size={20} color="#0EA5E9" />
          </View>
          <Text style={styles.infoText}>
            Save guest details for faster bookings. Verified guests get pre-checkin benefits.
          </Text>
        </MotiView>

        {savedGuests.length > 0 ? (
          <View style={styles.listContainer}>
            <AnimatePresence>
              {savedGuests.map((guest, index) => (
                <MotiView
                  key={guest.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: index * 100 } as any}
                  style={styles.guestCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <User size={24} color="#6B7280" />
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.guestName}>{guest.firstName} {guest.lastName}</Text>
                      <Text style={styles.guestAadhaar}>Adhaar: XXXX XXXX {guest.aadhaarNumber.slice(-4)}</Text>
                    </View>
                    {guest.aadhaarVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Shield size={12} color="#15803D" />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.unverifiedBadge}>
                        <AlertCircle size={12} color="#B45309" />
                        <Text style={styles.unverifiedBadgeText}>Unverified</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleShowDetails(guest)}
                    >
                      <Eye size={18} color="#4B5563" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleEditGuest(guest)}
                    >
                      <Edit2 size={18} color="#0EA5E9" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDeleteGuest(guest.id)}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Verification Status Banner */}
                  <View style={[
                    styles.statusBanner,
                    guest.aadhaarVerified ? styles.statusBannerVerified : styles.statusBannerUnverified
                  ]}>
                    {guest.aadhaarVerified ? (
                      <>
                        <View style={styles.statusContent}>
                          <Text style={styles.statusTitle}>Ready for Pre-checkin</Text>
                          <Text style={styles.statusSubtitle}>Identity verified successfully</Text>
                        </View>
                        <Shield size={20} color="#15803D" />
                      </>
                    ) : (
                      <>
                        <View style={styles.statusContent}>
                          <Text style={styles.statusTitleUnverified}>Verify Identity</Text>
                          <Text style={styles.statusSubtitleUnverified}>Enable pre-checkin benefits</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => handleVerifyGuest(guest)}
                        >
                          <Text style={styles.verifyBtnText}>Verify</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </MotiView>
              ))}
            </AnimatePresence>
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 } as any}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconCircle}>
              <User size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Guests</Text>
            <Text style={styles.emptyText}>
              Add guests to speed up your booking process. Verifying them allows for faster check-ins.
            </Text>
            <TouchableOpacity
              style={styles.addFirstGuestBtn}
              onPress={handleAddGuest}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.addFirstGuestText}>Add Your First Guest</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </ScrollView>

      {/* Aadhaar Verification Modal */}
      <AadhaarVerificationModal
        visible={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setVerifyingGuest(null);
        }}
        onSuccess={handleVerificationSuccess}
        guestName={verifyingGuest ? `${verifyingGuest.firstName} ${verifyingGuest.lastName || ''}`.trim() : ''}
        aadhaarNumber={verifyingGuest?.aadhaarNumber || ''}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedGuest(null);
        }}
        guest={selectedGuest}
        onVerifyGuest={handleVerifyGuest}
      />

      {/* Add/Edit Guest Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <MotiView

            transition={{ type: 'spring', damping: 15 } as any}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGuest ? 'Edit Guest Details' : 'Add New Guest'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.firstName}
                  onChangeText={(t) => setGuestForm({ ...guestForm, firstName: t })}
                  placeholder="e.g. Rahul"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.lastName}
                  onChangeText={(t) => setGuestForm({ ...guestForm, lastName: t })}
                  placeholder="e.g. Sharma"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.phoneNumber}
                  onChangeText={(t) => setGuestForm({ ...guestForm, phoneNumber: t })}
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Aadhaar Number <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.aadhaarNumber}
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, '').slice(0, 12);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                    setGuestForm({ ...guestForm, aadhaarNumber: formatted });
                  }}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
                <Text style={styles.helperText}>Used for secure identity verification</Text>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveGuest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingGuest ? 'Update Guest' : 'Save Guest'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </MotiView>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },

  // Info Card
  infoCard: {
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoIconContainer: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },

  // List
  listContainer: {
    gap: 16,
  },
  guestCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  guestAadhaar: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  unverifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  statusBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBannerVerified: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusBannerUnverified: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#166534',
  },
  statusTitleUnverified: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  statusSubtitleUnverified: {
    fontSize: 12,
    color: '#64748B',
  },
  verifyBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 22,
  },
  addFirstGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  addFirstGuestText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeModalText: {
    fontSize: 22,
    color: '#9CA3AF',
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
