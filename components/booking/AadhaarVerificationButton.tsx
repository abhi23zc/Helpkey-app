import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Shield } from 'lucide-react-native';

interface AadhaarVerificationButtonProps {
  guestIndex?: number;
  guestName?: string;
  onVerificationComplete?: (verificationData: any) => void;
  style?: any;
}

export default function AadhaarVerificationButton({ 
  guestIndex, 
  guestName, 
  onVerificationComplete,
  style 
}: AadhaarVerificationButtonProps) {
  
  const handleVerification = () => {
    // For now, show an alert that this would redirect to verification
    // In a real implementation, this would integrate with Cashfree or similar service
    Alert.alert(
      'Aadhaar Verification',
      `This would redirect ${guestName || `Guest ${(guestIndex || 0) + 1}`} to the Aadhaar verification process. This feature requires integration with Cashfree or similar verification service.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate Verification', 
          onPress: () => {
            // Simulate successful verification for demo purposes
            const mockVerificationData = {
              aadhaarNumber: '1234567890XX',
              fullName: guestName || 'Verified Guest',
              verified: true,
              verifiedAt: new Date(),
              dateOfBirth: '01/01/1990',
              address: 'Sample Address, City, State - 123456',
              phoneNumber: '+91 9876543210'
            };
            onVerificationComplete?.(mockVerificationData);
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.verifyButton, style]} 
      onPress={handleVerification}
    >
      <Shield size={14} color="#FFF" />
      <Text style={styles.verifyButtonText}>Verify Aadhaar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verifyButton: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});