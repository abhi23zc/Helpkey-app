import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, CheckCircle, AlertCircle, User, Calendar, MapPin, Lock, Info, Home } from 'lucide-react-native';
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
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AadhaarVerificationModal from '@/components/AadhaarVerificationModal';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VerificationScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const insets = useSafeAreaInsets();

  const isVerified = userData?.aadhaarData?.verified || false;

  // Helper function to format date properly
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';

    try {
      // Handle Firebase Timestamp
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }

      // Handle Date object or string
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
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
        <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {!isVerified ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 } as any}
          >
            <View style={styles.unverifiedContainer}>
              <View style={styles.iconCircle}>
                <Shield size={48} color="#0EA5E9" />
              </View>
              <Text style={styles.unverifiedTitle}>Verify Your Identity</Text>
              <Text style={styles.unverifiedText}>
                Complete your Aadhaar verification to unlock fast, secure, and contactless check-ins at hotels.
              </Text>

              <View style={styles.benefitsContainer}>
                <View style={styles.benefitRow}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Instant pre-checkin approval</Text>
                </View>
                <View style={styles.benefitRow}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Secure and encrypted data</Text>
                </View>
                <View style={styles.benefitRow}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>No paperwork at front desk</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.verifyButton}
                activeOpacity={0.9}
                onPress={() => setShowVerificationModal(true)}
              >
                <Text style={styles.verifyButtonText}>Verify Aadhaar Now</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        ) : (
          <>
            {/* Status Card */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 } as any}
              style={styles.statusCard}
            >
              <View style={styles.successIconCircle}>
                <CheckCircle size={40} color="#10B981" strokeWidth={3} />
              </View>
              <Text style={styles.statusTitle}>Aadhaar Verified!</Text>
              <Text style={styles.statusText}>
                Your identity has been successfully verified. You can now enjoy pre-checkin benefits for all your bookings.
              </Text>
            </MotiView>

            {/* Verification Details */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 } as any}
              style={styles.detailsCard}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Verified Details</Text>
                {userData?.aadhaarData?.photo && (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${userData.aadhaarData.photo}` }}
                      style={styles.userPhoto}
                    />
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{userData?.aadhaarData?.fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{userData?.aadhaarData?.gender}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Care Of</Text>
                <Text style={styles.infoValue}>{userData?.aadhaarData?.careOf}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aadhaar Number</Text>
                <Text style={[styles.infoValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 }]}>
                  XXXX XXXX {userData?.aadhaarData?.aadhaarNumber?.slice(-4)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified On</Text>
                <Text style={styles.infoValue}>{formatDate(userData?.aadhaarData?.verifiedAt)}</Text>
              </View>
            </MotiView>

            {/* Address Card */}
            {userData?.aadhaarData?.splitAddress && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 200 } as any}
                style={styles.detailsCard}
              >
                <Text style={styles.cardTitle}>Detailed Address</Text>
                <View style={styles.divider} />

                <View style={styles.addressGrid}>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>House</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.house || '-'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>Street</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.street || '-'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>Locality</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.locality || '-'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>District</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.dist || '-'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>State</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.state || '-'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Text style={styles.addressLabel}>Pincode</Text>
                    <Text style={styles.addressValue}>{userData.aadhaarData.splitAddress.pincode || '-'}</Text>
                  </View>
                </View>
              </MotiView>
            )}

            {/* Security Info */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 300 } as any}
              style={styles.securityCard}
            >
              <View style={styles.securityHeader}>
                <Lock size={16} color="#6B7280" />
                <Text style={styles.securityTitle}>Data Privacy & Security</Text>
              </View>
              <Text style={styles.securityText}>
                Your Aadhaar data is encrypted and securely stored. We only use this information to verify your identity for hotel bookings and regulatory compliance.
                Your full Aadhaar number is never shared with hotels.
              </Text>
            </MotiView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
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
  content: {
    flex: 1,
    padding: 20,
  },

  // Unverified State
  unverifiedContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unverifiedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  unverifiedText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Verified State
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#D1FAE5',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  photoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },

  // Address Grid
  addressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  addressItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Security
  securityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
