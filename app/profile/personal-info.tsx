import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Calendar, MapPin, Phone, Save, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
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

interface PersonalInfoForm {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  emergencyContact: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalInfoForm>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || '',
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        emergencyContact: userData.emergencyContact || '',
        street: userData.street || '',
        city: userData.city || '',
        state: userData.state || '',
        pincode: userData.pincode || ''
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user?.uid) return;

    // Basic validation
    if (!formData.fullName.trim()) {
      Alert.alert('Required', 'Full name is required');
      return;
    }

    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      Alert.alert('Invalid', 'Please enter a valid 6-digit pincode');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''), // Store only digits
        updatedAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updateData);

      Alert.alert('Success', 'Personal information updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating personal info:', error);
      Alert.alert('Error', 'Failed to update information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 10);
    if (limited.length >= 6) {
      return `${limited.slice(0, 5)} ${limited.slice(5)}`;
    }
    return limited;
  };

  const formatPincode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    icon: Icon,
    multiline = false,
    maxLength
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: any;
    icon: any;
    multiline?: boolean;
    maxLength?: number;
  }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 } as any}
      style={styles.inputContainer}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        focusedField === label && styles.inputWrapperFocused
      ]}>
        <Icon size={18} color="#00D9FF" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          keyboardType={keyboardType}
          onFocus={() => setFocusedField(label)}
          onBlur={() => setFocusedField(null)}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          maxLength={maxLength}
        />
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
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
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <InputField
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
              icon={User}
              maxLength={50}
            />

            <InputField
              label="Phone Number"
              value={formatPhoneNumber(formData.phoneNumber)}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text.replace(/\D/g, '') }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              icon={Phone}
            />

            <InputField
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dateOfBirth: text }))}
              placeholder="DD/MM/YYYY"
              icon={Calendar}
              maxLength={10}
            />

            <InputField
              label="Gender"
              value={formData.gender}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gender: text }))}
              placeholder="Male/Female/Other"
              icon={User}
            />

            <InputField
              label="Emergency Contact"
              value={formatPhoneNumber(formData.emergencyContact)}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContact: text.replace(/\D/g, '') }))}
              placeholder="Emergency contact number"
              keyboardType="phone-pad"
              icon={Phone}
            />
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <InputField
              label="Street Address"
              value={formData.street}
              onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
              placeholder="Enter your street address"
              icon={MapPin}
              multiline
            />

            <InputField
              label="City"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Enter your city"
              icon={MapPin}
            />

            <InputField
              label="State"
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              placeholder="Enter your state"
              icon={MapPin}
            />

            <InputField
              label="Pincode"
              value={formData.pincode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: formatPincode(text) }))}
              placeholder="Enter 6-digit pincode"
              keyboardType="number-pad"
              icon={MapPin}
            />
          </View>

          {/* Info Note */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 500, type: 'timing', duration: 300 } as any}
            style={styles.infoNote}
          >
            <AlertCircle size={16} color="#00D9FF" />
            <Text style={styles.infoText}>
              Your personal information is securely stored and used only for booking purposes.
            </Text>
          </MotiView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: '#00D9FF',
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: 16,
    paddingBottom: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});