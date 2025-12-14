import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import PhoneValidator from '@/utils/phoneValidation';

interface NotificationTesterProps {
  visible?: boolean;
}

export default function NotificationTester({ visible = true }: NotificationTesterProps) {
  const [phoneNumber, setPhoneNumber] = useState('916389055071');
  const [customMessage, setCustomMessage] = useState('');
  const [testType, setTestType] = useState<'booking' | 'payment' | 'reminder' | 'custom'>('booking');
  const [phoneValidation, setPhoneValidation] = useState(PhoneValidator.validateAndFormat('916389055071'));
  
  const { sendNotification, sendCustomMessage, isLoading, error } = useNotifications();

  // Validate phone number in real-time
  useEffect(() => {
    const validation = PhoneValidator.validateAndFormat(phoneNumber);
    setPhoneValidation(validation);
  }, [phoneNumber]);

  const testBookingNotification = async () => {
    const testData = {
      hotelName: 'Grand Horizon Hotel',
      roomType: 'Deluxe Room',
      guestName: 'John Doe',
      checkIn: 'Monday, December 11, 2024, 02:00 PM',
      checkOut: 'Tuesday, December 12, 2024, 11:00 AM',
      totalAmount: 2500,
      bookingId: 'BK123456',
      guestPhone: phoneNumber,
      nights: 1,
      guests: 2,
      additionalRequests: 'Early check-in, High floor room'
    };

    const success = await sendNotification({
      type: 'booking_confirmed',
      data: testData
    });

    if (success) {
      Alert.alert('Success', 'Test booking notification sent!');
    } else {
      Alert.alert('Error', error || 'Failed to send notification');
    }
  };

  const testPaymentNotification = async () => {
    const testData = {
      hotelName: 'Grand Horizon Hotel',
      roomType: 'Deluxe Room',
      guestName: 'John Doe',
      checkIn: 'Monday, December 11, 2024, 02:00 PM',
      totalAmount: 2500,
      paymentId: 'pay_123456789',
      guestPhone: phoneNumber
    };

    const success = await sendNotification({
      type: 'payment_success',
      data: testData
    });

    if (success) {
      Alert.alert('Success', 'Test payment notification sent!');
    } else {
      Alert.alert('Error', error || 'Failed to send notification');
    }
  };

  const testReminderNotification = async () => {
    const testData = {
      hotelName: 'Grand Horizon Hotel',
      roomType: 'Deluxe Room',
      guestName: 'John Doe',
      checkIn: 'Tomorrow, December 12, 2024, 02:00 PM',
      bookingId: 'BK123456',
      guestPhone: phoneNumber
    };

    const success = await sendNotification({
      type: 'checkin_reminder',
      data: testData
    });

    if (success) {
      Alert.alert('Success', 'Test reminder notification sent!');
    } else {
      Alert.alert('Error', error || 'Failed to send notification');
    }
  };

  const testCustomNotification = async () => {
    if (!customMessage.trim()) {
      Alert.alert('Error', 'Please enter a custom message');
      return;
    }

    const success = await sendCustomMessage(phoneNumber, customMessage);

    if (success) {
      Alert.alert('Success', 'Custom notification sent!');
      setCustomMessage('');
    } else {
      Alert.alert('Error', error || 'Failed to send notification');
    }
  };

  const handleTest = () => {
    // Validate phone number before sending
    if (!phoneValidation.isValid) {
      Alert.alert('Invalid Phone Number', phoneValidation.error || 'Please enter a valid phone number');
      return;
    }

    switch (testType) {
      case 'booking':
        testBookingNotification();
        break;
      case 'payment':
        testPaymentNotification();
        break;
      case 'reminder':
        testReminderNotification();
        break;
      case 'custom':
        testCustomNotification();
        break;
    }
  };

  if (!visible) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📱 WhatsApp Notification Tester</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Phone Number (with country code):</Text>
        <TextInput
          style={[
            styles.input,
            phoneValidation.isValid ? styles.inputValid : styles.inputInvalid
          ]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="916389055071 or 9876543210"
          keyboardType="phone-pad"
        />
        
        {/* Phone Validation Feedback */}
        <View style={styles.validationContainer}>
          {phoneValidation.isValid ? (
            <View style={styles.validationSuccess}>
              <Text style={styles.validationSuccessText}>
                ✅ Valid: {PhoneValidator.formatForDisplay(phoneNumber)}
              </Text>
              <Text style={styles.validationDetails}>
                API Format: {phoneValidation.formattedNumber}
              </Text>
            </View>
          ) : (
            <View style={styles.validationError}>
              <Text style={styles.validationErrorText}>
                ❌ {phoneValidation.error}
              </Text>
              {phoneValidation.originalNumber && (
                <Text style={styles.validationDetails}>
                  Original: {phoneValidation.originalNumber}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Phone Format Examples */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>📝 Supported Formats:</Text>
          <Text style={styles.exampleText}>• 916389055071 (with country code)</Text>
          <Text style={styles.exampleText}>• +91 6389055071 (with + and spaces)</Text>
          <Text style={styles.exampleText}>• 6389055071 (10 digits, will add +91)</Text>
          <Text style={styles.exampleText}>• 06389055071 (with 0 prefix, will remove)</Text>
          <Text style={styles.exampleText}>• +91-638-905-5071 (with dashes)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Test Type:</Text>
        <View style={styles.buttonRow}>
          {[
            { key: 'booking', label: '🎉 Booking' },
            { key: 'payment', label: '💳 Payment' },
            { key: 'reminder', label: '⏰ Reminder' },
            { key: 'custom', label: '✏️ Custom' }
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                testType === type.key && styles.typeButtonActive
              ]}
              onPress={() => setTestType(type.key as any)}
            >
              <Text style={[
                styles.typeButtonText,
                testType === type.key && styles.typeButtonTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {testType === 'custom' && (
        <View style={styles.section}>
          <Text style={styles.label}>Custom Message:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={customMessage}
            onChangeText={setCustomMessage}
            placeholder="Enter your custom message here..."
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.testButton, 
          (isLoading || !phoneValidation.isValid) && styles.testButtonDisabled
        ]}
        onPress={handleTest}
        disabled={isLoading || !phoneValidation.isValid}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.testButtonText}>
            {!phoneValidation.isValid ? 'Fix Phone Number First' : 'Send Test Notification'}
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          • Booking: Sends a complete booking confirmation with all details
        </Text>
        <Text style={styles.infoText}>
          • Payment: Sends a payment success notification
        </Text>
        <Text style={styles.infoText}>
          • Reminder: Sends a check-in reminder message
        </Text>
        <Text style={styles.infoText}>
          • Custom: Sends your custom message
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#00BFA6',
    borderColor: '#00BFA6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#00BFA6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1565c0',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  validationContainer: {
    marginTop: 8,
  },
  validationSuccess: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  validationError: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  validationSuccessText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
  },
  validationErrorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
  },
  validationDetails: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  examplesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});