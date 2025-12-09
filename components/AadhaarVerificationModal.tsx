import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CheckCircle, Shield, AlertCircle } from 'lucide-react-native';
import { API_ENDPOINTS } from '@/config/api';

interface AadhaarVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (verificationData: any) => void;
  guestName?: string;
  aadhaarNumber?: string;
}

export default function AadhaarVerificationModal({
  visible,
  onClose,
  onSuccess,
  guestName,
  aadhaarNumber: initialAadhaar = ''
}: AadhaarVerificationModalProps) {
  const [step, setStep] = useState(1); // 1: Enter Aadhaar, 2: Enter OTP, 3: Success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState(initialAadhaar);
  const [otp, setOtp] = useState('');
  const [refId, setRefId] = useState('');

  const formatAadhaarNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    return limited.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validateAadhaarNumber = (aadhaar: string) => {
    const digits = aadhaar.replace(/\s/g, '');
    return digits.length === 12 && /^\d{12}$/.test(digits);
  };

  const handleSendOTP = async () => {
    if (!validateAadhaarNumber(aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.aadhaar.sendOTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRefId(data.refId);
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!refId) {
      setError('Reference ID not found. Please try sending OTP again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.aadhaar.verifyOTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp,
          refId: refId,
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        setStep(3);
        onSuccess({
          aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
          verificationData: data.data,
          verified: true,
          verifiedAt: new Date()
        });
      } else {
        setError(data.error || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError('');
    setOtp('');
    setRefId('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {step === 1 && 'Aadhaar Verification'}
                {step === 2 && 'Enter OTP'}
                {step === 3 && 'Verification Complete'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#DC2626" strokeWidth={2} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 && (
              <View style={styles.content}>
                {guestName && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Verifying Aadhaar for: <Text style={styles.infoBold}>{guestName}</Text>
                    </Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Aadhaar Number</Text>
                  <TextInput
                    style={styles.input}
                    value={aadhaarNumber}
                    onChangeText={(text) => setAadhaarNumber(formatAadhaarNumber(text))}
                    placeholder="XXXX XXXX XXXX"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                  <Text style={styles.helperText}>Enter your 12-digit Aadhaar number</Text>
                </View>

                <View style={styles.warningBox}>
                  <Shield size={20} color="#D97706" strokeWidth={2} />
                  <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>Secure Verification</Text>
                    <Text style={styles.warningText}>
                      OTP will be sent to your registered mobile number. Your Aadhaar details are encrypted and stored securely.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (!validateAadhaarNumber(aadhaarNumber) || isLoading) && styles.buttonDisabled
                  ]}
                  onPress={handleSendOTP}
                  disabled={!validateAadhaarNumber(aadhaarNumber) || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.content}>
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    OTP has been sent to your registered mobile number ending with your Aadhaar.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.buttonSecondaryText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonPrimary,
                      (otp.length !== 6 || isLoading) && styles.buttonDisabled
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={otp.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.content}>
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <CheckCircle size={48} color="#10B981" strokeWidth={2} />
                  </View>
                  <Text style={styles.successTitle}>Verification Successful!</Text>
                  <Text style={styles.successMessage}>
                    {guestName ? `${guestName}'s Aadhaar` : 'Your Aadhaar'} has been successfully verified.
                  </Text>
                  <TouchableOpacity style={styles.button} onPress={handleClose}>
                    <Text style={styles.buttonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    margin: 20,
    marginBottom: 0,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
  },
  infoBold: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: '#065F46',
  },
  button: {
    backgroundColor: '#00BFA6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  buttonPrimary: {
    flex: 1,
  },
  buttonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});
