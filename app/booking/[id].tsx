import { useAuth } from '@/context/AuthContext';
import { getBookingById } from '@/services/bookingService';
import PreferencesDisplay from '@/components/booking/PreferencesDisplay';
import CancelBookingModal from '@/components/booking/CancelBookingModal';
import RefundRequestModal from '@/components/booking/RefundRequestModal';
import useNotificationHandler from '@/hooks/useNotificationHandler';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '@/config/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Alert } from 'react-native';
import {
  AlertCircle,
  ArrowLeft,
  Bed,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  XCircle,
  Calendar,
  Home,
  ShieldCheck,
  Receipt
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BookingDetails {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  unitPrice: number;
  totalPrice: number;
  taxesAndFees: number;
  bookingType: string;
  hourlyDuration?: number;
  hotelId: string;
  roomId: string;
  userId: string;
  userEmail: string;
  hotelAdmin?: string;
  preCheckinStatus?: string;
  preCheckinId?: string;
  hotelDetails: {
    hotelId: string;
    name: string;
    location: string;
    image: string;
  };
  roomDetails: {
    roomId: string;
    type: string;
    roomNumber: string | null;
    price: number;
    beds: string;
    size: string;
    image: string;
  };
  guestInfo: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    aadhaarVerified: boolean;
    aadhaarData: any;
    specialRequests: string;
  }>;
  guestVerifications: Array<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    aadhaarNumber: string;
    verified: boolean;
    verificationDetails: any;
  }>;
  paymentInfo: {
    method: string;
    status: string;
    orderId: string | null;
    paymentId: string | null;
    signature: string | null;
  };
  paymentMode?: string;
  preferencesPrice?: number;
  preferencesPriceBreakdown?: Array<{ label: string; price: number; quantity?: number }>;
  customerPreferences: {
    preCheckinEnabled?: boolean;
    travelerType?: string;
    travelerTypeId?: string;
    dynamicPreferences?: Record<string, any>;
    [key: string]: any;
  };
  customerVerification: any;
  createdAt: any;
}

export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Notification hooks
  const { sendNotification } = useNotifications(); // WhatsApp notifications
  const { sendCompleteCancellationNotifications } = useNotificationHandler(); // Push notifications

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundRequest, setRefundRequest] = useState<any>(null);
  const [loadingRefund, setLoadingRefund] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await getBookingById(id as string);
      const bookingData = data as BookingDetails;
      setBooking(bookingData);

      if (bookingData && bookingData.status === 'cancelled') {
        await checkRefundRequest(id as string);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRefundRequest = async (bookingId: string) => {
    try {
      setLoadingRefund(true);
      const q = query(
        collection(db, 'refundRequests'),
        where('bookingId', '==', bookingId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setRefundRequest({
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        });
      } else {
        setRefundRequest(null);
      }
    } catch (error) {
      console.error('Error checking refund request:', error);
    } finally {
      setLoadingRefund(false);
    }
  };

  const handleCancelBooking = async (reason: string) => {
    try {
      if (!booking) return;

      console.log('🚫 Cancelling booking:', booking.reference);

      // Update booking status in Firebase
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: user?.uid || 'user',
      });

      // Update local state
      setBooking({ ...booking, status: 'cancelled' });

      // Send notifications (WhatsApp + Push)
      try {
        console.log('📧 Sending cancellation notifications...');

        // Prepare notification data
        const notificationData = {
          bookingId: booking.reference,
          hotelId: booking.hotelId,
          hotelName: booking.hotelDetails.name,
          guestName: booking.guestInfo?.[0] ? `${booking.guestInfo[0].firstName} ${booking.guestInfo[0].lastName}` : 'Guest',
          guestPhone: booking.guestInfo?.[0]?.phone || user?.phoneNumber || '',
          amount: booking.totalAmount,
          checkinDate: booking.checkIn,
          checkoutDate: booking.checkOut,
          roomType: booking.roomDetails.type,
          nights: booking.nights,
          hotelAdmin: booking.hotelAdmin,
          cancellationReason: reason,
        };

        // Send WhatsApp notifications (existing system)
        await sendNotification({
          type: 'booking_cancelled',
          data: { ...notificationData, reason }
        });

        await sendNotification({
          type: 'admin_booking_cancelled_by_user',
          data: { ...notificationData, reason }
        });

        // Send Push notifications (new system)
        const pushSuccess = await sendCompleteCancellationNotifications(notificationData);
        console.log('📱 Push notifications result:', pushSuccess);

        console.log('✅ All cancellation notifications sent successfully');

      } catch (notificationError) {
        console.error('❌ Error sending cancellation notifications:', notificationError);
        // Don't fail the cancellation if notifications fail
      }

      Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully. You and the hotel will receive notifications.');

    } catch (e) {
      console.error('❌ Error cancelling booking:', e);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(52, 211, 153, 0.3)' };
      case 'confirmed':
        return { bg: 'rgba(0, 217, 255, 0.15)', text: '#00D9FF', border: 'rgba(0, 217, 255, 0.3)' };
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(248, 113, 113, 0.3)' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  const { bg, text, border } = getStatusColor(booking.status);
  const StatusIcon = getStatusIcon(booking.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />

      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          alignItems: SCREEN_WIDTH > 768 ? 'center' : 'stretch',
        }}
      >
        <View style={{ width: SCREEN_WIDTH > 768 ? 700 : '100%' }}>

          {/* Status Banner */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 } as any}
            style={[styles.statusBanner, { backgroundColor: bg, borderColor: border }]}
          >
            <StatusIcon size={20} color={text} strokeWidth={2.5} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusBannerTitle, { color: text }]}>Booking {booking.status}</Text>
              <Text style={[styles.statusBannerText, { color: text, opacity: 0.8 }]}>
                Reference ID: {booking.reference}
              </Text>
            </View>
          </MotiView>

          {/* Pre-checkin Status */}
          {booking.customerPreferences?.preCheckinEnabled && (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 } as any}
              style={styles.preCheckinBanner}
            >
              <View style={styles.preCheckinHeader}>
                <View style={styles.preCheckinIconContainer}>
                  <ShieldCheck size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.preCheckinTitle}>Pre-checkin Activated</Text>
                  <Text style={styles.preCheckinSubtitle}>
                    {booking.preCheckinStatus === 'confirmed'
                      ? 'Skip the front desk and go directly to your room!'
                      : 'Setting up your pre-checkin access...'}
                  </Text>
                </View>
                {booking.preCheckinStatus === 'confirmed' && (
                  <View style={styles.preCheckinBadge}>
                    <CheckCircle size={16} color="#059669" />
                    <Text style={styles.preCheckinBadgeText}>Confirmed</Text>
                  </View>
                )}
              </View>

              {booking.preCheckinId && (
                <View style={styles.preCheckinDetails}>
                  <View style={styles.preCheckinDetailRow}>
                    <Receipt size={14} color="#047857" />
                    <Text style={styles.preCheckinDetailText}>
                      Pre-checkin ID: {booking.preCheckinId}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.preCheckinBenefits}>
                <View style={styles.preCheckinBenefit}>
                  <CheckCircle size={12} color="#059669" />
                  <Text style={styles.preCheckinBenefitText}>No waiting at reception</Text>
                </View>
                <View style={styles.preCheckinBenefit}>
                  <CheckCircle size={12} color="#059669" />
                  <Text style={styles.preCheckinBenefitText}>Direct room access</Text>
                </View>
                <View style={styles.preCheckinBenefit}>
                  <CheckCircle size={12} color="#059669" />
                  <Text style={styles.preCheckinBenefitText}>Faster check-in process</Text>
                </View>
              </View>
            </MotiView>
          )}

          {/* Hotel Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.hotelCard}
            onPress={() => router.push(`/hotel/${booking.hotelId}` as any)}
          >
            <Image
              source={{ uri: booking.hotelDetails.image.replace(/\.avif$/, '.jpg') }}
              style={styles.hotelImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10, 14, 39, 0.95)']}
              style={styles.hotelOverlay}
            >
              <Text style={styles.hotelName}>{booking.hotelDetails.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#00D9FF" />
                <Text style={styles.locationText}>{booking.hotelDetails.location}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Booking Summary */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Trip Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <View style={styles.iconBox}>
                  <Calendar size={18} color="#00D9FF" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Check-in</Text>
                  <Text style={styles.summaryValue}>{formatDate(booking.checkIn)}</Text>
                  <Text style={styles.summarySubValue}>{formatTime(booking.checkIn)}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.iconBox}>
                  <Calendar size={18} color="#00D9FF" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Check-out</Text>
                  <Text style={styles.summaryValue}>{formatDate(booking.checkOut)}</Text>
                  <Text style={styles.summarySubValue}>{formatTime(booking.checkOut)}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.summaryGrid, { marginTop: 12 }]}>
              <View style={styles.summaryItem}>
                <View style={styles.iconBox}>
                  <Users size={18} color="#00D9FF" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Guests</Text>
                  <Text style={styles.summaryValue}>{booking.guests} Guests</Text>
                  <Text style={styles.summarySubValue}>{booking.roomDetails.type}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.iconBox}>
                  <Clock size={18} color="#00D9FF" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>
                    {booking.bookingType === 'hourly'
                      ? `${booking.hourlyDuration || 0} Hours`
                      : `${booking.nights || 1} Nights`}
                  </Text>
                  <Text style={styles.summarySubValue}>{booking.bookingType || 'Nightly'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Primary Guest */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Primary Guest</Text>
            <View style={styles.guestCard}>
              <View style={styles.guestRow}>
                <View style={styles.guestIcon}>
                  <User size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestLabel}>Name</Text>
                  <Text style={styles.guestValue}>
                    {booking.guestInfo[0]?.firstName} {booking.guestInfo[0]?.lastName}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.guestRow}>
                <View style={styles.guestIcon}>
                  <Phone size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestLabel}>Phone</Text>
                  <Text style={styles.guestValue}>{booking.guestInfo[0]?.phone}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.guestRow}>
                <View style={styles.guestIcon}>
                  <Mail size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestLabel}>Email</Text>
                  <Text style={styles.guestValue}>{booking.guestInfo[0]?.email}</Text>
                </View>
              </View>

              {/* Aadhaar Verification Status */}
              {booking.guestVerifications && booking.guestVerifications.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.guestRow}>
                    <View style={[styles.guestIcon, { backgroundColor: booking.guestVerifications[0]?.verified ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)' }]}>
                      <ShieldCheck size={20} color={booking.guestVerifications[0]?.verified ? '#34D399' : '#F87171'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestLabel}>Aadhaar Verification</Text>
                      <Text style={[styles.guestValue, { color: booking.guestVerifications[0]?.verified ? '#34D399' : '#F87171' }]}>
                        {booking.guestVerifications[0]?.verified ? 'Verified' : 'Not Verified'}
                      </Text>
                      {booking.guestVerifications[0]?.aadhaarNumber && (
                        <Text style={styles.guestSubValue}>
                          XXXX XXXX {booking.guestVerifications[0].aadhaarNumber.slice(-4)}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Guest Verification Details */}
          {booking.guestVerifications && booking.guestVerifications.length > 0 && booking.guestVerifications[0]?.verified && booking.guestVerifications[0]?.verificationDetails && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Verification Details</Text>
              <View style={styles.verificationCard}>
                <View style={styles.verificationHeader}>
                  <ShieldCheck size={18} color="#34D399" />
                  <Text style={styles.verificationTitle}>Aadhaar Verified Successfully</Text>
                </View>

                <View style={styles.verificationGrid}>
                  <View style={styles.verificationItem}>
                    <Text style={styles.verificationLabel}>Full Name</Text>
                    <Text style={styles.verificationValue}>
                      {booking.guestVerifications[0].verificationDetails.fullName || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.verificationItem}>
                    <Text style={styles.verificationLabel}>Date of Birth</Text>
                    <Text style={styles.verificationValue}>
                      {booking.guestVerifications[0].verificationDetails.rawCashfreeResponse?.dob || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.verificationGrid}>
                  <View style={styles.verificationItem}>
                    <Text style={styles.verificationLabel}>Gender</Text>
                    <Text style={styles.verificationValue}>
                      {booking.guestVerifications[0].verificationDetails.gender === 'M' ? 'Male' :
                        booking.guestVerifications[0].verificationDetails.gender === 'F' ? 'Female' : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.verificationItem}>
                    <Text style={styles.verificationLabel}>Reference ID</Text>
                    <Text style={styles.verificationValue}>
                      {booking.guestVerifications[0].verificationDetails.refId || 'N/A'}
                    </Text>
                  </View>
                </View>

                {booking.guestVerifications[0].verificationDetails.address && (
                  <View style={styles.verificationAddressContainer}>
                    <Text style={styles.verificationLabel}>Address</Text>
                    <Text style={styles.verificationAddressText}>
                      {booking.guestVerifications[0].verificationDetails.address}
                    </Text>
                  </View>
                )}

                <View style={styles.verificationFooter}>
                  <Text style={styles.verificationFooterText}>
                    Verified on {booking.guestVerifications[0].verificationDetails.verifiedAt ?
                      new Date(booking.guestVerifications[0].verificationDetails.verifiedAt.seconds * 1000).toLocaleDateString('en-IN') :
                      'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Booking Preferences */}
          {booking.customerPreferences && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Booking Preferences</Text>

              {/* Use PreferencesDisplay component for dynamic preferences */}
              <PreferencesDisplay preferences={booking.customerPreferences} />

              {/* Fallback for basic preferences if no dynamic preferences */}
              {!booking.customerPreferences.dynamicPreferences && (
                <View style={styles.preferencesCard}>
                  {booking.customerPreferences.travelerType && (
                    <View style={styles.preferenceRow}>
                      <Text style={styles.preferenceLabel}>Traveler Type</Text>
                      <Text style={styles.preferenceValue}>
                        {booking.customerPreferences.travelerType.charAt(0).toUpperCase() +
                          booking.customerPreferences.travelerType.slice(1)}
                      </Text>
                    </View>
                  )}

                  {booking.customerPreferences.preCheckinEnabled && (
                    <View style={styles.preferenceRow}>
                      <Text style={styles.preferenceLabel}>Pre-checkin</Text>
                      <View style={styles.preferenceEnabledBadge}>
                        <CheckCircle size={12} color="#34D399" />
                        <Text style={styles.preferenceEnabledText}>Enabled</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Payment Summary */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Payment Breakdown</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentRowLabel}>
                  Room Rate {booking.bookingType === 'hourly'
                    ? `(${booking.hourlyDuration || 0} hrs)`
                    : `(${booking.nights} night${booking.nights > 1 ? 's' : ''})`}
                </Text>
                <Text style={styles.paymentRowValue}>
                  ₹{(booking.totalPrice || booking.unitPrice) - (booking.preferencesPrice || 0)}
                </Text>
              </View>

              {/* Show detailed preferences breakdown */}
              {booking.preferencesPriceBreakdown && booking.preferencesPriceBreakdown.length > 0 && (
                <>
                  <View style={[styles.divider, { marginVertical: 8 }]} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#00D9FF', marginBottom: 8, marginTop: 4 }}>
                    Preferences & Add-ons
                  </Text>
                  {booking.preferencesPriceBreakdown.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 8 }}>
                      <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', flex: 1, marginRight: 12 }}>
                        • {item.label}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#00D9FF', textAlign: 'right' }}>
                        {item.quantity && item.quantity > 1
                          ? `₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}`
                          : `₹${item.price}`}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.divider, { marginVertical: 8 }]} />
                </>
              )}

              <View style={styles.paymentRow}>
                <Text style={styles.paymentRowLabel}>Taxes & Fees (18%)</Text>
                <Text style={styles.paymentRowValue}>₹{booking.taxesAndFees}</Text>
              </View>

              <View style={[styles.divider, { marginVertical: 12 }]} />

              <View style={styles.paymentRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
              </View>

              <View style={styles.paymentMethodRow}>
                <CreditCard size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.paymentMethodText}>
                  Paid via {booking.paymentInfo?.method || booking.paymentMode === 'hotel' ? 'Cash at Hotel' : 'Online'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cancellation Action */}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          {/* Refund Status */}
          {(booking.status === 'cancelled' && booking.paymentInfo?.status === 'captured') && (
            <View style={styles.refundContainer}>
              <Text style={styles.refundTitle}>Refund Status</Text>
              {refundRequest ? (
                <View style={styles.refundStatusBox}>
                  <Text style={styles.refundStatusText}>
                    Request {refundRequest.status}. {refundRequest.status === 'approved' ? 'Refund processed.' : 'Please wait for update.'}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.requestRefundButton}
                  onPress={() => setShowRefundModal(true)}
                >
                  <Text style={styles.requestRefundText}>Request Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Modals */}
      <CancelBookingModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        bookingReference={booking.reference}
      />

      <RefundRequestModal
        visible={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        bookingId={booking.id}
        bookingReference={booking.reference}
        totalAmount={booking.totalAmount}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0a0e27',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusBannerText: {
    fontSize: 13,
  },

  // Hotel Card
  hotelCard: {
    marginHorizontal: 20,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
    position: 'relative',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  hotelName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },

  // Sections
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f3a',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  summarySubValue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Guest Card
  guestCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  guestValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },

  // Payment
  paymentCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentRowLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  paymentRowValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00D9FF',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  paymentMethodText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Buttons
  cancelButton: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 15,
  },

  // Refund
  refundContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FFF',
  },
  requestRefundButton: {
    backgroundColor: '#00D9FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestRefundText: {
    color: '#0a0e27',
    fontWeight: '600',
  },
  refundStatusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  refundStatusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },

  // Pre-checkin Styles
  preCheckinBanner: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  preCheckinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  preCheckinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preCheckinTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
  },
  preCheckinSubtitle: {
    fontSize: 13,
    color: 'rgba(52, 211, 153, 0.8)',
    marginTop: 2,
  },
  preCheckinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  preCheckinBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  preCheckinDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  preCheckinDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preCheckinDetailText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '500',
  },
  preCheckinBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preCheckinBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  preCheckinBenefitText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '500',
  },

  // Guest Verification Styles
  guestSubValue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  verificationCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34D399',
  },
  verificationGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  verificationItem: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  verificationValue: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  verificationAddressContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  verificationAddressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  verificationFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  verificationFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },

  // Preferences Styles
  preferencesCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  preferenceEnabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  preferenceEnabledText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
  },
});
