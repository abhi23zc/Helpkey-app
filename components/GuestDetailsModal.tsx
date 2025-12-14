import React from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CheckCircle, AlertCircle, Shield, X } from 'lucide-react-native';

interface SavedGuest {
  id: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  aadhaarNumber: string;
  aadhaarVerified?: boolean;
  aadhaarData?: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    verifiedAt: Date | any;
    gender?: string;
    photo?: string;
    careOf?: string;
    email?: string;
    splitAddress?: {
      country: string;
      dist: string;
      house: string;
      landmark: string;
      pincode: number;
      po: string;
      state: string;
      street: string;
      subdist: string;
      vtc: string;
      locality: string;
    };
    refId?: string;
    yearOfBirth?: number;
    shareCode?: string;
    xmlFile?: string;
    rawCashfreeResponse?: any;
  };
}

interface GuestDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  guest: SavedGuest | null;
  onVerifyGuest: (guest: SavedGuest) => void;
}

export default function GuestDetailsModal({
  visible,
  onClose,
  guest,
  onVerifyGuest
}: GuestDetailsModalProps) {
  if (!guest) return null;

  // Helper function to format date
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    try {
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('en-IN');
      }
      return new Date(dateValue).toLocaleDateString('en-IN');
    } catch {
      return 'N/A';
    }
  };

  // Helper function to get Aadhaar data
  const getAadhaarValue = (field: string) => {
    if (!guest?.aadhaarData) return 'N/A';
    
    const rawData = guest.aadhaarData.rawCashfreeResponse;
    const directData = guest.aadhaarData;
    
    switch (field) {
      case 'name':
        return rawData?.name || directData.fullName || 'N/A';
      case 'dob':
        return rawData?.dob || directData.dateOfBirth || 'N/A';
      case 'gender':
        return rawData?.gender || directData.gender || 'N/A';
      case 'careOf':
        return rawData?.care_of || directData.careOf || 'N/A';
      case 'address':
        return rawData?.address || directData.address || 'N/A';
      case 'verifiedAt':
        return formatDate(directData.verifiedAt);
      default:
        return 'N/A';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Guest Details - {guest.firstName} {guest.lastName || ''}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name:</Text>
                    <Text style={styles.infoValue}>{guest.firstName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Name:</Text>
                    <Text style={styles.infoValue}>{guest.lastName || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <Text style={styles.infoValue}>{guest.phoneNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Aadhaar Number:</Text>
                    <Text style={[styles.infoValue, styles.monoFont]}>
                      XXXX XXXX {guest.aadhaarNumber.slice(-4)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Aadhaar Verification Status */}
              <View style={styles.verificationSection}>
                <View style={styles.verificationHeader}>
                  <Shield size={24} color="#00BFA6" strokeWidth={2} />
                  <View style={styles.verificationHeaderText}>
                    <Text style={styles.verificationTitle}>Aadhaar Verification</Text>
                    <Text style={styles.verificationSubtitle}>
                      Identity verification status for {guest.firstName}
                    </Text>
                  </View>
                </View>

                {guest.aadhaarVerified ? (
                  <View style={styles.verifiedContent}>
                    <View style={styles.statusBadge}>
                      <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                      <Text style={styles.statusText}>Verified Successfully</Text>
                    </View>

                    {/* Verified Details */}
                    <View style={styles.detailsCard}>
                      <Text style={styles.detailsCardTitle}>Verified Details</Text>
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Full Name:</Text>
                          <Text style={styles.detailValue}>{getAadhaarValue('name')}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Date of Birth:</Text>
                          <Text style={styles.detailValue}>{getAadhaarValue('dob')}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Gender:</Text>
                          <Text style={styles.detailValue}>{getAadhaarValue('gender')}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Care Of:</Text>
                          <Text style={styles.detailValue}>{getAadhaarValue('careOf')}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Aadhaar Number:</Text>
                          <Text style={[styles.detailValue, styles.monoFont]}>
                            XXXX XXXX {guest.aadhaarNumber.slice(-4)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Verified On:</Text>
                          <Text style={styles.detailValue}>{getAadhaarValue('verifiedAt')}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Address */}
                    {getAadhaarValue('address') !== 'N/A' && (
                      <View style={styles.detailsCard}>
                        <Text style={styles.detailsCardTitle}>Address</Text>
                        <Text style={styles.addressText}>{getAadhaarValue('address')}</Text>
                      </View>
                    )}

                    {/* Detailed Address */}
                    {guest.aadhaarData?.rawCashfreeResponse?.split_address && (
                      <View style={styles.detailsCard}>
                        <Text style={styles.detailsCardTitle}>Detailed Address</Text>
                        <View style={styles.splitAddressGrid}>
                          {guest.aadhaarData.rawCashfreeResponse.split_address.house && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>House:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.house}
                              </Text>
                            </View>
                          )}
                          {guest.aadhaarData.rawCashfreeResponse.split_address.street && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>Street:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.street}
                              </Text>
                            </View>
                          )}
                          {guest.aadhaarData.rawCashfreeResponse.split_address.locality && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>Locality:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.locality}
                              </Text>
                            </View>
                          )}
                          {guest.aadhaarData.rawCashfreeResponse.split_address.dist && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>District:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.dist}
                              </Text>
                            </View>
                          )}
                          {guest.aadhaarData.rawCashfreeResponse.split_address.state && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>State:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.state}
                              </Text>
                            </View>
                          )}
                          {guest.aadhaarData.rawCashfreeResponse.split_address.pincode && (
                            <View style={styles.splitAddressRow}>
                              <Text style={styles.splitAddressLabel}>Pincode:</Text>
                              <Text style={styles.splitAddressValue}>
                                {guest.aadhaarData.rawCashfreeResponse.split_address.pincode}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Aadhaar Photo */}
                    {guest.aadhaarData?.rawCashfreeResponse?.photo_link && (
                      <View style={styles.detailsCard}>
                        <Text style={styles.detailsCardTitle}>Aadhaar Photo</Text>
                        <View style={styles.photoContainer}>
                          <Image
                            source={{
                              uri: `data:image/jpeg;base64,${guest.aadhaarData.rawCashfreeResponse.photo_link}`
                            }}
                            style={styles.aadhaarPhoto}
                            resizeMode="cover"
                          />
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.unverifiedContent}>
                    <View style={styles.statusBadge}>
                      <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
                      <Text style={[styles.statusText, styles.unverifiedText]}>Not Verified</Text>
                    </View>

                    <View style={styles.benefitsCard}>
                      <Text style={styles.benefitsTitle}>Benefits of Verification</Text>
                      <View style={styles.benefitsList}>
                        <View style={styles.benefitItem}>
                          <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                          <Text style={styles.benefitText}>Enable pre-checkin for hotel bookings</Text>
                        </View>
                        <View style={styles.benefitItem}>
                          <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                          <Text style={styles.benefitText}>Skip front desk queues</Text>
                        </View>
                        <View style={styles.benefitItem}>
                          <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                          <Text style={styles.benefitText}>Faster check-in process</Text>
                        </View>
                        <View style={styles.benefitItem}>
                          <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                          <Text style={styles.benefitText}>Secure identity verification</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => {
                        onClose();
                        onVerifyGuest(guest);
                      }}
                    >
                      <Shield size={20} color="#fff" strokeWidth={2} />
                      <Text style={styles.verifyButtonText}>
                        Verify {guest.firstName}'s Aadhaar Now
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.verifyNote}>
                      Complete verification to enable pre-checkin features
                    </Text>
                  </View>
                )}
              </View>

              {/* Pre-checkin Status */}
              <View style={styles.preCheckinSection}>
                <View style={styles.preCheckinHeader}>
                  <Shield size={24} color="#10B981" strokeWidth={2} />
                  <View style={styles.preCheckinHeaderText}>
                    <Text style={styles.preCheckinTitle}>Pre-checkin Status</Text>
                    <Text style={styles.preCheckinSubtitle}>
                      Pre-checkin eligibility for {guest.firstName}
                    </Text>
                  </View>
                </View>
                <View style={styles.preCheckinCard}>
                  <View style={styles.preCheckinRow}>
                    <View style={styles.preCheckinInfo}>
                      <Text style={styles.preCheckinLabel}>Pre-checkin Eligibility</Text>
                      <Text style={styles.preCheckinDesc}>
                        {guest.aadhaarVerified
                          ? 'This guest can use pre-checkin for faster hotel bookings'
                          : 'Aadhaar verification required for pre-checkin eligibility'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.eligibilityBadge,
                        guest.aadhaarVerified ? styles.eligibleBadge : styles.ineligibleBadge
                      ]}
                    >
                      <Text
                        style={[
                          styles.eligibilityText,
                          guest.aadhaarVerified ? styles.eligibleText : styles.ineligibleText
                        ]}
                      >
                        {guest.aadhaarVerified ? 'Eligible' : 'Requires Verification'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    paddingRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  monoFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verificationSection: {
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00BFA6',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  verificationHeaderText: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  verifiedContent: {
    gap: 12,
  },
  unverifiedContent: {
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  unverifiedText: {
    color: '#F59E0B',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  splitAddressGrid: {
    gap: 8,
  },
  splitAddressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitAddressLabel: {
    fontSize: 13,
    color: '#666',
  },
  splitAddressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aadhaarPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFA6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  verifyNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  preCheckinSection: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  preCheckinHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  preCheckinHeaderText: {
    flex: 1,
  },
  preCheckinTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  preCheckinSubtitle: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  preCheckinCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  preCheckinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  preCheckinInfo: {
    flex: 1,
  },
  preCheckinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  preCheckinDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  eligibilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  eligibleBadge: {
    backgroundColor: '#D1FAE5',
  },
  ineligibleBadge: {
    backgroundColor: '#FEF3C7',
  },
  eligibilityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eligibleText: {
    color: '#10B981',
  },
  ineligibleText: {
    color: '#F59E0B',
  },
  closeButtonBottom: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
});
