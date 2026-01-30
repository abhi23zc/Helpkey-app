import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, Save, AlertCircle, CheckCircle, Shield } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Utility function for phone validation
const validatePhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
};

// Utility function for formatting phone number
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
  if (limited.length >= 6) {
    return `${limited.slice(0, 5)} ${limited.slice(5)}`;
  }
  return limited;
};

// Move PhoneInputField component OUTSIDE to prevent recreation on every render
const PhoneInputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  description,
  required = false,
  focusedField,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  description?: string;
  required?: boolean;
  focusedField: string | null;
  onFocus: () => void;
  onBlur: () => void;
}) => {
  const isValid = value ? validatePhoneNumber(value) : !required;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 } as any}
      style={styles.inputContainer}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {value && (
          <View style={[styles.validationBadge, isValid ? styles.validBadge : styles.invalidBadge]}>
            {isValid ? (
              <CheckCircle size={12} color="#059669" />
            ) : (
              <AlertCircle size={12} color="#EF4444" />
            )}
          </View>
        )}
      </View>

      <View style={[
        styles.inputWrapper,
        focusedField === label && styles.inputWrapperFocused,
        !isValid && value && styles.inputWrapperError
      ]}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formatPhoneNumber(value)}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, ''))}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          keyboardType="phone-pad"
          onFocus={onFocus}
          onBlur={onBlur}
          maxLength={11} // 10 digits + 1 space
        />
      </View>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {!isValid && value && (
        <Text style={styles.errorText}>
          Please enter a valid 10-digit Indian mobile number
        </Text>
      )}
    </MotiView>
  );
};

export default function PhoneNumberScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Load user data only once when component mounts
  useEffect(() => {
    if (userData && !dataLoadedRef.current) {
      setPhoneNumber(userData.phoneNumber || '');
      setEmergencyContact(userData.emergencyContact || '');
      dataLoadedRef.current = true;
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user?.uid) return;

    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert('Required', 'Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (emergencyContact && !validatePhoneNumber(emergencyContact)) {
      Alert.alert('Invalid', 'Please enter a valid emergency contact number');
      return;
    }

    if (phoneNumber === emergencyContact) {
      Alert.alert('Invalid', 'Emergency contact should be different from your phone number');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        emergencyContact: emergencyContact.replace(/\D/g, ''),
        updatedAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updateData);

      Alert.alert('Success', 'Phone numbers updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating phone numbers:', error);
      Alert.alert('Error', 'Failed to update phone numbers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />

      {/* Header */}
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a']}
        style={[styles.header]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phone Number</Text>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Save size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Phone Display */}
          {userData?.phoneNumber && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 } as any}
              style={styles.currentPhoneCard}
            >
              <View style={styles.currentPhoneHeader}>
                <Phone size={20} color="#00D9FF" />
                <Text style={styles.currentPhoneTitle}>Current Phone Number</Text>
              </View>
              <Text style={styles.currentPhoneNumber}>
                +91 {formatPhoneNumber(userData.phoneNumber)}
              </Text>
            </MotiView>
          )}

          {/* Phone Number Input */}
          <PhoneInputField
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your mobile number"
            description="This will be used for booking confirmations and important updates"
            required
            focusedField={focusedField}
            onFocus={() => setFocusedField("Phone Number")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Emergency Contact Input */}
          <PhoneInputField
            label="Emergency Contact"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Enter emergency contact number"
            description="A trusted contact who can be reached in case of emergency"
            focusedField={focusedField}
            onFocus={() => setFocusedField("Emergency Contact")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Security Note */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 500, type: 'timing', duration: 300 } as any}
            style={styles.securityNote}
          >
            <Shield size={16} color="#059669" />
            <View style={styles.securityNoteContent}>
              <Text style={styles.securityNoteTitle}>Secure & Private</Text>
              <Text style={styles.securityNoteText}>
                Your phone numbers are encrypted and used only for essential communications.
                We never share your contact information with third parties.
              </Text>
            </View>
          </MotiView>

          {/* Usage Info */}
          <View style={styles.usageInfo}>
            <Text style={styles.usageTitle}>How we use your phone number:</Text>
            <View style={styles.usageList}>
              <Text style={styles.usageItem}>• Booking confirmations and updates</Text>
              <Text style={styles.usageItem}>• Check-in and check-out notifications</Text>
              <Text style={styles.usageItem}>• Emergency contact during your stay</Text>
              <Text style={styles.usageItem}>• Account security verification</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(0, 217, 255, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  currentPhoneCard: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  currentPhoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPhoneTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00D9FF',
    marginLeft: 8,
  },
  currentPhoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  required: {
    color: '#EF4444',
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  validBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  invalidBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#00D9FF',
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  countryCode: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  securityNoteContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  securityNoteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  usageInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  usageList: {
    gap: 8,
  },
  usageItem: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
});