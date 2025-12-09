import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, Shield, Eye } from 'lucide-react-native';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
              Alert.alert('Success', 'Guest deleted successfully');
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
          splitAddress: verificationData.verificationData?.splitAddress 
            ? {
                country: verificationData.verificationData.splitAddress.country || '',
                dist: verificationData.verificationData.splitAddress.dist || '',
                house: verificationData.verificationData.splitAddress.house || '',
                landmark: verificationData.verificationData.splitAddress.landmark || '',
                pincode: parseInt(verificationData.verificationData.splitAddress.pincode) || 0,
                po: verificationData.verificationData.splitAddress.po || '',
                state: verificationData.verificationData.splitAddress.state || '',
                street: verificationData.verificationData.splitAddress.street || '',
                subdist: verificationData.verificationData.splitAddress.subdist || '',
                vtc: verificationData.verificationData.splitAddress.vtc || '',
                locality: verificationData.verificationData.splitAddress.locality || '',
              }
            : undefined,
          refId: verificationData.verificationData?.refId,
          yearOfBirth: verificationData.verificationData?.yearOfBirth,
          shareCode: verificationData.verificationData?.shareCode,
          xmlFile: verificationData.verificationData?.xmlFile,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Guests</Text>
        <TouchableOpacity onPress={handleAddGuest} style={styles.addButton}>
          <Plus size={24} color="#00BFA6" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Save guest information for faster bookings. You can select from saved guests during checkout.
          </Text>
        </View>

        {savedGuests.length > 0 ? (
          <View style={styles.guestList}>
            {savedGuests.map((guest) => (
              <View key={guest.id} style={styles.guestCard}>
                <View style={styles.guestHeader}>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>
                      {guest.firstName} {guest.lastName || ''}
                    </Text>
                    {guest.phoneNumber && (
                      <Text style={styles.guestPhone}>{guest.phoneNumber}</Text>
                    )}
                    <Text style={styles.guestAadhaar}>
                      Aadhaar: XXXX XXXX {guest.aadhaarNumber.slice(-4)}
                    </Text>
                    {guest.aadhaarVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Shield size={12} color="#10B981" strokeWidth={2} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.unverifiedBadge}>
                        <Text style={styles.unverifiedText}>Not Verified</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.guestActions}>
                    <TouchableOpacity
                      onPress={() => handleShowDetails(guest)}
                      style={[styles.actionButton, styles.viewButton]}
                    >
                      <Eye size={18} color="#10B981" strokeWidth={2} />
                    </TouchableOpacity>
                    {!guest.aadhaarVerified && (
                      <TouchableOpacity
                        onPress={() => handleVerifyGuest(guest)}
                        style={[styles.actionButton, styles.verifyButton]}
                      >
                        <Shield size={18} color="#00BFA6" strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleEditGuest(guest)}
                      style={styles.actionButton}
                    >
                      <Edit2 size={18} color="#00BFA6" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteGuest(guest.id)}
                      style={styles.actionButton}
                    >
                      <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
                {guest.aadhaarVerified && (
                  <View style={styles.preCheckinInfo}>
                    <Shield size={16} color="#10B981" strokeWidth={2} />
                    <Text style={styles.preCheckinText}>Pre-checkin enabled</Text>
                  </View>
                )}
                
                {/* Verification Actions */}
                <View style={styles.verificationActions}>
                  {guest.aadhaarVerified ? (
                    <View style={styles.verifiedSection}>
                      <View style={styles.verifiedBanner}>
                        <View style={styles.verifiedBannerContent}>
                          <Text style={styles.verifiedBannerTitle}>Identity Verified</Text>
                          <Text style={styles.verifiedBannerSubtitle}>Pre-checkin enabled</Text>
                        </View>
                        <Shield size={20} color="#10B981" strokeWidth={2} />
                      </View>
                      <TouchableOpacity
                        style={styles.viewDetailsButton}
                        onPress={() => handleShowDetails(guest)}
                      >
                        <Eye size={16} color="#666" strokeWidth={2} />
                        <Text style={styles.viewDetailsText}>View Full Details</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.unverifiedSection}>
                      <TouchableOpacity
                        style={styles.verifyAadhaarButton}
                        onPress={() => handleVerifyGuest(guest)}
                      >
                        <Shield size={16} color="#fff" strokeWidth={2} />
                        <Text style={styles.verifyAadhaarText}>Verify Aadhaar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.viewDetailsButton}
                        onPress={() => handleShowDetails(guest)}
                      >
                        <Eye size={16} color="#666" strokeWidth={2} />
                        <Text style={styles.viewDetailsText}>View Details</Text>
                      </TouchableOpacity>
                      <Text style={styles.verifyNote}>Verify to enable pre-checkin</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Plus size={48} color="#CCC" strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No saved guests</Text>
            <Text style={styles.emptyText}>
              Add guest information to speed up your booking process
            </Text>
            <TouchableOpacity onPress={handleAddGuest} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Add Your First Guest</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.firstName}
                  onChangeText={(text) => setGuestForm({ ...guestForm, firstName: text })}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.lastName}
                  onChangeText={(text) => setGuestForm({ ...guestForm, lastName: text })}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.phoneNumber}
                  onChangeText={(text) => setGuestForm({ ...guestForm, phoneNumber: text })}
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar Number *</Text>
                <TextInput
                  style={styles.input}
                  value={guestForm.aadhaarNumber}
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, '').slice(0, 12);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                    setGuestForm({ ...guestForm, aadhaarNumber: formatted });
                  }}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={14}
                />
                <Text style={styles.helperText}>Enter 12-digit Aadhaar number</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveGuest}
                  style={styles.saveButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingGuest ? 'Update' : 'Add Guest'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA6',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  guestList: {
    gap: 16,
    paddingBottom: 20,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  guestPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  guestAadhaar: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  unverifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  guestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  verifyButton: {
    backgroundColor: '#E8F5F3',
  },
  viewButton: {
    backgroundColor: '#D1FAE5',
  },
  preCheckinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  preCheckinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  verificationActions: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
    marginTop: 12,
  },
  verifiedSection: {
    gap: 8,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  verifiedBannerContent: {
    flex: 1,
  },
  verifiedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  verifiedBannerSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  unverifiedSection: {
    gap: 8,
  },
  verifyAadhaarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFA6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  verifyAadhaarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  verifyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00BFA6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
