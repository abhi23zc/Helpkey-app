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
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'approved':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'processed':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      default:
        return { bg: '#F3F4F6', text: '#1F2937' };
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
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View
          style={{
            flex: 1,
            marginTop: 50,
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              Request Refund
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {loadingRequest ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10, color: '#6B7280' }}>
                  Checking refund status...
                </Text>
              </View>
            ) : existingRequest ? (
              // Show existing request status
              <View
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                      Refund Request Status
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
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
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      <Text style={{ fontWeight: '600' }}>Reason:</Text>{' '}
                      {existingRequest.reason}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      <Text style={{ fontWeight: '600' }}>Requested:</Text>{' '}
                      {formatDate(existingRequest.requestedAt)}
                    </Text>
                  </View>
                  {existingRequest.adminNotes && (
                    <View>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        <Text style={{ fontWeight: '600' }}>Admin Notes:</Text>{' '}
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
                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E40AF' }}>
                    Booking Reference: {bookingReference}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', marginTop: 4 }}>
                    Refund Amount: ₹{totalAmount.toLocaleString()}
                  </Text>
                </View>

                {/* Reason */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Reason for Refund *
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      backgroundColor: 'white',
                    }}
                  >
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
                          borderBottomColor: '#E5E7EB',
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: formData.reason === reason ? '#2563EB' : '#D1D5DB',
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
                                backgroundColor: '#2563EB',
                              }}
                            />
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#374151' }}>{reason}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Additional Details
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Please provide any additional details..."
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      color: '#111827',
                      textAlignVertical: 'top',
                      backgroundColor: 'white',
                    }}
                  />
                </View>

                {/* Contact Phone */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Contact Phone Number *
                  </Text>
                  <TextInput
                    value={formData.contactPhone}
                    onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      color: '#111827',
                      backgroundColor: 'white',
                    }}
                  />
                </View>

                {/* Preferred Refund Method */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Preferred Refund Method
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      backgroundColor: 'white',
                    }}
                  >
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
                          borderBottomColor: '#E5E7EB',
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
                                ? '#2563EB'
                                : '#D1D5DB',
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
                                backgroundColor: '#2563EB',
                              }}
                            />
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#374151' }}>{method.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Refund Policy */}
                <View
                  style={{
                    backgroundColor: '#FFFBEB',
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#D97706"
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 }}>
                        Refund Policy:
                      </Text>
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 12, color: '#92400E' }}>
                          • Refunds are processed within 2-3 business days
                        </Text>
                        <Text style={{ fontSize: 12, color: '#92400E' }}>
                          • Full refund available until 24 hours before check-in
                        </Text>
                        <Text style={{ fontSize: 12, color: '#92400E' }}>
                          • Partial refund may apply for cancellations within 24 hours
                        </Text>
                        <Text style={{ fontSize: 12, color: '#92400E' }}>
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
                  style={{
                    backgroundColor: isSubmitting ? '#93C5FD' : '#2563EB',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                        Submitting...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
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
