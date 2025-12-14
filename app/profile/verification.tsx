import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AadhaarVerificationModal from '@/components/AadhaarVerificationModal';

export default function VerificationScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const isVerified = userData?.aadhaarData?.verified || false;

  // Helper function to format date properly
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle Firebase Timestamp
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      
      // Handle Date object or string
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const handleVerificationSuccess = async (verificationData: any) => {
    if (!user?.uid) return;

    try {
      const aadhaarData = {
        aadhaarNumber: verificationData.aadhaarNumber,
        fullName: verificationData.verificationData?.name || '',
        dateOfBirth: verificationData.verificationData?.dob || '',
        address: verificationData.verificationData?.address || '',
        phoneNumber: verificationData.verificationData?.mobile_hash || '',
        verified: true,
        verifiedAt: verificationData.verifiedAt,
        gender: verificationData.verificationData?.gender,
        photo: verificationData.verificationData?.photo,
        careOf: verificationData.verificationData?.careOf,
        email: verificationData.verificationData?.email,
        splitAddress: verificationData.verificationData?.splitAddress,
        refId: verificationData.verificationData?.refId,
        yearOfBirth: verificationData.verificationData?.yearOfBirth,
        shareCode: verificationData.verificationData?.shareCode,
        xmlFile: verificationData.verificationData?.xmlFile,
        rawCashfreeResponse: verificationData.verificationData?.rawCashfreeResponse,
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { aadhaarData });

      setShowVerificationModal(false);
      Alert.alert('Success', 'Your Aadhaar has been verified successfully!');
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
        <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isVerified ? (
          <>
            <View style={styles.warningCard}>
              <AlertCircle size={24} color="#F59E0B" strokeWidth={2} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Identity Verification Required</Text>
                <Text style={styles.warningText}>
                  To enable pre-checkin for your booking, please verify your Aadhaar identity below. This is a one-time process that will make future bookings faster and more convenient.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Shield size={24} color="#00BFA6" strokeWidth={2} />
                <View style={styles.infoHeaderText}>
                  <Text style={styles.infoTitle}>Aadhaar Verification</Text>
                  <Text style={styles.infoSubtitle}>
                    Verify your Aadhaar to enable pre-checkin for faster hotel bookings
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsList}>
                <Text style={styles.benefitsTitle}>Benefits of Verification:</Text>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.benefitText}>Skip check-in queues at hotels</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.benefitText}>Faster booking process</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.benefitText}>Secure identity verification</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.benefitText}>Enable pre-checkin for hotel bookings</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => setShowVerificationModal(true)}
              >
                <Shield size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.verifyButtonText}>Verify Aadhaar Now</Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Complete verification to enable pre-checkin features
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedIcon}>
                <CheckCircle size={64} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.verifiedTitle}>Aadhaar Verified!</Text>
              <Text style={styles.verifiedText}>
                Your identity has been successfully verified. You can now enjoy pre-checkin benefits for all your bookings.
              </Text>
            </View>

            {/* Verified Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Verified Details</Text>
              <View style={styles.detailsContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailValue}>
                    {userData?.aadhaarData?.fullName || userData?.fullName || 'N/A'}
                  </Text>
                </View>
                {userData?.aadhaarData?.dateOfBirth && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Birth:</Text>
                    <Text style={styles.detailValue}>{userData.aadhaarData.dateOfBirth}</Text>
                  </View>
                )}
                {userData?.aadhaarData?.gender && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{userData.aadhaarData.gender}</Text>
                  </View>
                )}
                {userData?.aadhaarData?.careOf && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Care Of:</Text>
                    <Text style={styles.detailValue}>{userData.aadhaarData.careOf}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aadhaar Number:</Text>
                  <Text style={[styles.detailValue, styles.monoFont]}>
                    XXXX XXXX {userData?.aadhaarData?.aadhaarNumber?.slice(-4) || '****'}
                  </Text>
                </View>
                {userData?.aadhaarData?.verifiedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verified On:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(userData.aadhaarData.verifiedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Address Card */}
            {userData?.aadhaarData?.address && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsCardTitle}>Address</Text>
                <Text style={styles.addressText}>{userData.aadhaarData.address}</Text>
              </View>
            )}

            {/* Detailed Address Card */}
            {userData?.aadhaarData?.splitAddress && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsCardTitle}>Detailed Address</Text>
                <View style={styles.splitAddressGrid}>
                  {userData.aadhaarData.splitAddress.house && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>House:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.house}</Text>
                    </View>
                  )}
                  {userData.aadhaarData.splitAddress.street && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>Street:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.street}</Text>
                    </View>
                  )}
                  {userData.aadhaarData.splitAddress.locality && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>Locality:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.locality}</Text>
                    </View>
                  )}
                  {userData.aadhaarData.splitAddress.dist && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>District:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.dist}</Text>
                    </View>
                  )}
                  {userData.aadhaarData.splitAddress.state && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>State:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.state}</Text>
                    </View>
                  )}
                  {userData.aadhaarData.splitAddress.pincode && (
                    <View style={styles.splitAddressItem}>
                      <Text style={styles.splitAddressLabel}>Pincode:</Text>
                      <Text style={styles.splitAddressValue}>{userData.aadhaarData.splitAddress.pincode}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Aadhaar Photo Card */}
            {(userData?.aadhaarData?.photo || userData?.aadhaarData?.rawCashfreeResponse?.photo_link) && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsCardTitle}>Aadhaar Photo</Text>
                <View style={styles.photoContainer}>
                  <Image
                    source={{
                      uri: `data:image/jpeg;base64,${
                        userData.aadhaarData.photo || 
                        userData.aadhaarData.rawCashfreeResponse?.photo_link
                      }`
                    }}
                    style={styles.aadhaarPhoto}
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}

            {/* Pre-checkin Status Card */}
            <View style={styles.preCheckinCard}>
              <View style={styles.preCheckinHeader}>
                <Shield size={24} color="#10B981" strokeWidth={2} />
                <Text style={styles.preCheckinTitle}>Pre-checkin Status</Text>
              </View>
              <Text style={styles.preCheckinDesc}>
                Pre-checkin allows you to skip hotel front desk queues with verified identity
              </Text>
              <View style={styles.preCheckinBadge}>
                <Text style={styles.preCheckinBadgeLabel}>Pre-checkin Eligibility:</Text>
                <View style={styles.preCheckinBadgeValue}>
                  <Text style={styles.preCheckinBadgeText}>Eligible ✓</Text>
                </View>
              </View>
              <Text style={styles.preCheckinNote}>
                ✅ You can now enable pre-checkin during hotel bookings for a faster, contactless experience.
              </Text>
            </View>

            {/* Security Information Card */}
            <View style={styles.securityCard}>
              <Text style={styles.securityTitle}>Security & Privacy</Text>
              <View style={styles.securityItem}>
                <Text style={styles.securityBullet}>🔒</Text>
                <Text style={styles.securityText}>
                  Your Aadhaar data is encrypted and stored securely following government guidelines
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityBullet}>✅</Text>
                <Text style={styles.securityText}>
                  We use government-approved OTP verification for Aadhaar authentication
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityBullet}>👁️</Text>
                <Text style={styles.securityText}>
                  Your full Aadhaar number is never displayed - only last 4 digits are shown
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityBullet}>🗑️</Text>
                <Text style={styles.securityText}>
                  You can request deletion of your verification data at any time
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Aadhaar Verification Modal */}
      <AadhaarVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
        guestName="Your Identity"
        aadhaarNumber=""
      />
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
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  infoHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoHeaderText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFA6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  verifiedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 16,
  },
  verifiedIcon: {
    marginBottom: 20,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 16,
  },
  detailsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  detailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
  },
  monoFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  splitAddressGrid: {
    gap: 12,
  },
  splitAddressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitAddressLabel: {
    fontSize: 14,
    color: '#666',
  },
  splitAddressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  preCheckinCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginBottom: 16,
  },
  preCheckinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  preCheckinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  preCheckinDesc: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    marginBottom: 16,
  },
  preCheckinBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginBottom: 12,
  },
  preCheckinBadgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  preCheckinBadgeValue: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  preCheckinBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  preCheckinNote: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 20,
  },
  securityCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  securityBullet: {
    fontSize: 16,
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  aadhaarPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
});
