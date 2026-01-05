import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface RefundRequestModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  bookingReference: string;
  totalAmount: number;
  onRequestSubmitted?: () => void;
}

interface ExistingRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reason: string;
  requestedAt: any;
  adminNotes?: string;
}

export default function RefundRequestModal({
  visible,
  onClose,
  bookingId,
  bookingReference,
  totalAmount,
  onRequestSubmitted,
}: RefundRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [formData, setFormData] = useState({
    reason: 'Booking cancellation',
    description: '',
    contactPhone: '',
    preferredRefundMethod: 'original_payment_method',
  });

  // Check for existing refund request
  useEffect(() => {
    if (visible) {
      checkExistingRequest();
    }
  }, [visible, bookingId]);

  const checkExistingRequest = async () => {
    setLoadingRequest(true);
    try {
      const q = query(
        collection(db, 'refundRequests'),
        where('bookingId', '==', bookingId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const request = querySnapshot.docs[0].data();
        setExistingRequest({
          id: querySnapshot.docs[0].id,
          ...request,
        } as ExistingRequest);
      } else {
        setExistingRequest(null);
      }
    } catch (error) {
      console.error('Error checking existing refund request:', error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.contactPhone.trim()) {
      Alert.alert('Required Field', 'Please enter your contact phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create refund request in Firestore
      await addDoc(collection(db, 'refundRequests'), {
        bookingId,
        bookingReference,
        totalAmount,
        reason: formData.reason,
        description: formData.description,
        contactPhone: formData.contactPhone,
        preferredRefundMethod: formData.preferredRefundMethod,
        status: 'pending',
        requestedAt: serverTimestamp(),
        requestedBy: 'customer',
      });

      Alert.alert(
        'Success',
        'Refund request submitted successfully. We will process it within 2-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => {
              onRequestSubmitted?.();
              onClose();
            },
          },
        ]
      );

      // Reset form
      setFormData({
        reason: 'Booking cancellation',
        description: '',
        contactPhone: '',
        preferredRefundMethod: 'original_payment_method',
      });
    } catch (error) {
      console.error('Error submitting refund request:', error);
      Alert.alert('Error', 'Failed to submit refund request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24' };
      case 'approved':
        return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' };
      case 'rejected':
        return { bg: 'rgba(248, 113, 113, 0.15)', text: '#F87171' };
      case 'processed':
        return { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF' };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Request Refund
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {loadingRequest ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#00D9FF" />
                <Text style={{ marginTop: 10, color: 'rgba(255, 255, 255, 0.6)' }}>
                  Checking refund status...
                </Text>
              </View>
            ) : existingRequest ? (
              // Show existing request status
              <View style={styles.contentBox}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
                      Refund Request Status
                    </Text>
                    <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 }}>
                      You have already submitted a refund request for this booking.
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: getStatusColor(existingRequest.status).bg,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: getStatusColor(existingRequest.status).text,
                      }}
                    >
                      {existingRequest.status.charAt(0).toUpperCase() +
                        existingRequest.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 12, gap: 8 }}>
                  <View>
                    <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
                      <Text style={{ fontWeight: '600', color: '#FFF' }}>Reason:</Text>{' '}
                      {existingRequest.reason}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
                      <Text style={{ fontWeight: '600', color: '#FFF' }}>Requested:</Text>{' '}
                      {formatDate(existingRequest.requestedAt)}
                    </Text>
                  </View>
                  {existingRequest.adminNotes && (
                    <View>
                      <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
                        <Text style={{ fontWeight: '600', color: '#FFF' }}>Admin Notes:</Text>{' '}
                        {existingRequest.adminNotes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Show refund request form
              <>
                {/* Booking Info */}
                <View style={styles.infoBox}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#00D9FF' }}>
                    Booking Reference: {bookingReference}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF', marginTop: 4 }}>
                    Refund Amount: ₹{totalAmount.toLocaleString()}
                  </Text>
                </View>

                {/* Reason */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>
                    Reason for Refund *
                  </Text>
                  <View style={styles.inputContainer}>
                    {[
                      'Booking cancellation',
                      'Change of plans',
                      'Hotel unavailable',
                      'Payment error',
                      'Duplicate booking',
                      'Other',
                    ].map((reason) => (
                      <TouchableOpacity
                        key={reason}
                        onPress={() => setFormData({ ...formData, reason })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: formData.reason === reason ? '#00D9FF' : 'rgba(255, 255, 255, 0.3)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          {formData.reason === reason && (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#00D9FF',
                              }}
                            />
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#FFF' }}>{reason}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>
                    Additional Details
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Please provide any additional details..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={4}
                    style={styles.textInput}
                  />
                </View>

                {/* Contact Phone */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>
                    Contact Phone Number *
                  </Text>
                  <TextInput
                    value={formData.contactPhone}
                    onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                  />
                </View>

                {/* Preferred Refund Method */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>
                    Preferred Refund Method
                  </Text>
                  <View style={styles.inputContainer}>
                    {[
                      { value: 'original_payment_method', label: 'Original Payment Method' },
                      { value: 'bank_transfer', label: 'Bank Transfer' },
                      { value: 'upi', label: 'UPI' },
                      { value: 'wallet', label: 'Digital Wallet' },
                    ].map((method) => (
                      <TouchableOpacity
                        key={method.value}
                        onPress={() =>
                          setFormData({ ...formData, preferredRefundMethod: method.value })
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor:
                              formData.preferredRefundMethod === method.value
                                ? '#00D9FF'
                                : 'rgba(255, 255, 255, 0.3)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          {formData.preferredRefundMethod === method.value && (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#00D9FF',
                              }}
                            />
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#FFF' }}>{method.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Refund Policy */}
                <View style={styles.policyBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#00D9FF"
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#00D9FF', marginBottom: 8 }}>
                        Refund Policy:
                      </Text>
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                          • Refunds are processed within 2-3 business days
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                          • Full refund available until 24 hours before check-in
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                          • Partial refund may apply for cancellations within 24 hours
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                          • Refund amount will be credited to your original payment method
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator size="small" color="#0a0e27" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>
                        Submitting...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#0a0e27" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>
                        Submit Request
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#1a1f3a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  policyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '600',
  },
});
