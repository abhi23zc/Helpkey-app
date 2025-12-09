import { useAuth } from '@/context/AuthContext';
import { getBookingById } from '@/services/bookingService';
import PreferencesDisplay from '@/components/booking/PreferencesDisplay';
import CancelBookingModal from '@/components/booking/CancelBookingModal';
import RefundRequestModal from '@/components/booking/RefundRequestModal';
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
  XCircle
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
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

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
  customerPreferences: any;
  customerVerification: any;
  createdAt: any;
}

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'details' | 'room' | 'guest' | 'payment'>('details');
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
      
      // Check for existing refund request if booking is cancelled
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
        const request = querySnapshot.docs[0].data();
        setRefundRequest({
          id: querySnapshot.docs[0].id,
          ...request,
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

      // Update booking status in Firestore
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: user?.uid || 'user',
      });

      // Update local state
      setBooking({
        ...booking,
        status: 'cancelled',
      });

      Alert.alert(
        'Booking Cancelled',
        'Your booking has been cancelled successfully. You can now request a refund.',
        [
          {
            text: 'Request Refund',
            onPress: () => setShowRefundModal(true),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert(
        'Error',
        'Failed to cancel booking. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#28a745';
      case 'confirmed':
        return '#00BFA6';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return CheckCircle;
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return AlertCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFA6" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#dc3545" />
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const StatusIcon = getStatusIcon(booking.status);
  const statusColor = getStatusColor(booking.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={[styles.statusBadgeHeader, { backgroundColor: statusColor }]}>
          <StatusIcon size={14} color="#fff" strokeWidth={2.5} />
          <Text style={styles.statusTextHeader}>{booking.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Booking Reference & Dates */}
        <View style={styles.topSection}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceValue}>{booking.reference}</Text>

          {/* Booking Type Badge */}
          {booking.bookingType && (
            <View style={[
              styles.bookingTypeBadge,
              { backgroundColor: booking.bookingType === 'hourly' ? '#FFF4E6' : '#E8F5F3' }
            ]}>
              <Text style={[
                styles.bookingTypeBadgeText,
                { color: booking.bookingType === 'hourly' ? '#F57C00' : '#00BFA6' }
              ]}>
                {booking.bookingType === 'hourly' ? '⏱️ Hourly Booking' : '🌙 Nightly Booking'}
              </Text>
            </View>
          )}

          <View style={styles.datesContainer}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(booking.checkIn)}</Text>
              <Text style={styles.timeValue}>
                {booking.bookingType === 'hourly' ? formatTime(booking.checkIn) : '3:00 PM'}
              </Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(booking.checkOut)}</Text>
              <Text style={styles.timeValue}>
                {booking.bookingType === 'hourly' ? formatTime(booking.checkOut) : '11:00 AM'}
              </Text>
            </View>
          </View>

          <View style={styles.durationRow}>
            {booking.bookingType === 'hourly' && booking.hourlyDuration ? (
              <View style={styles.durationItem}>
                <Clock size={16} color="#F57C00" strokeWidth={2} />
                <Text style={[styles.durationText, { color: '#F57C00' }]}>
                  {booking.hourlyDuration} hour{booking.hourlyDuration > 1 ? 's' : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.durationItem}>
                <Clock size={16} color="#00BFA6" strokeWidth={2} />
                <Text style={styles.durationText}>{booking.nights} night{booking.nights > 1 ? 's' : ''}</Text>
              </View>
            )}
            <View style={styles.durationItem}>
              <Users size={16} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.durationText}>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.durationItem}>
              <Bed size={16} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.durationText}>1 room</Text>
            </View>
          </View>
        </View>

        {/* Hotel Image & Info */}
        <View style={styles.hotelSection}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: booking.hotelDetails.image.replace(/\.avif$/, '.jpg') }}
              style={styles.hotelImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{booking.hotelDetails.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#666" strokeWidth={2} />
              <Text style={styles.locationText}>{booking.hotelDetails.location}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'details' && styles.tabActive]}
            onPress={() => setSelectedTab('details')}
          >
            <Text style={[styles.tabText, selectedTab === 'details' && styles.tabTextActive]}>
              Booking Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'room' && styles.tabActive]}
            onPress={() => setSelectedTab('room')}
          >
            <Text style={[styles.tabText, selectedTab === 'room' && styles.tabTextActive]}>
              Room Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'guest' && styles.tabActive]}
            onPress={() => setSelectedTab('guest')}
          >
            <Text style={[styles.tabText, selectedTab === 'guest' && styles.tabTextActive]}>
              Guest Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'payment' && styles.tabActive]}
            onPress={() => setSelectedTab('payment')}
          >
            <Text style={[styles.tabText, selectedTab === 'payment' && styles.tabTextActive]}>
              Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {selectedTab === 'details' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking Reference:</Text>
                <Text style={styles.infoValue}>{booking.reference}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking Type:</Text>
                <Text style={styles.infoValue}>{booking.bookingType || 'Nightly'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusTextSmall}>{booking.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Important Information</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>• Check-in: 3:00 PM</Text>
                <Text style={styles.infoBoxText}>• Check-out: 11:00 AM</Text>
                <Text style={styles.infoBoxText}>• Valid ID proof required at check-in</Text>
                <Text style={styles.infoBoxText}>• Early check-in subject to availability</Text>
              </View>
            </View>
          )}

          {selectedTab === 'room' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room Information</Text>
              
              {booking.roomDetails.image && (
                <View style={styles.roomImageWrapper}>
                  <Image
                    source={{ uri: booking.roomDetails.image.replace(/\.avif$/, '.jpg') }}
                    style={styles.roomImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={styles.roomTypeContainer}>
                <Text style={styles.roomType}>{booking.roomDetails.type}</Text>
                {booking.roomDetails.roomNumber && (
                  <Text style={styles.roomNumber}>Room {booking.roomDetails.roomNumber}</Text>
                )}
              </View>

              <Text style={styles.sectionSubtitle}>Room Features</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <Bed size={20} color="#00BFA6" strokeWidth={2} />
                  <Text style={styles.featureLabel}>BEDS</Text>
                  <Text style={styles.featureValue}>{booking.roomDetails.beds}</Text>
                </View>
                <View style={styles.featureItem}>
                  <MapPin size={20} color="#00BFA6" strokeWidth={2} />
                  <Text style={styles.featureLabel}>SIZE</Text>
                  <Text style={styles.featureValue}>{booking.roomDetails.size} sq ft</Text>
                </View>
                <View style={styles.featureItem}>
                  <Users size={20} color="#00BFA6" strokeWidth={2} />
                  <Text style={styles.featureLabel}>CAPACITY</Text>
                  <Text style={styles.featureValue}>{booking.guests} guests</Text>
                </View>
                <View style={styles.featureItem}>
                  <DollarSign size={20} color="#00BFA6" strokeWidth={2} />
                  <Text style={styles.featureLabel}>PRICE</Text>
                  <Text style={styles.featureValue}>₹{booking.roomDetails.price}/night</Text>
                </View>
              </View>
            </View>
          )}

          {selectedTab === 'guest' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Guest</Text>
              
              {booking.guestInfo && booking.guestInfo[0] && (
                <>
                  <View style={styles.guestInfoRow}>
                    <User size={18} color="#666" strokeWidth={2} />
                    <View style={styles.guestInfoContent}>
                      <Text style={styles.guestInfoLabel}>Full Name</Text>
                      <Text style={styles.guestInfoValue}>
                        {booking.guestInfo[0].firstName} {booking.guestInfo[0].lastName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guestInfoRow}>
                    <Mail size={18} color="#666" strokeWidth={2} />
                    <View style={styles.guestInfoContent}>
                      <Text style={styles.guestInfoLabel}>Email</Text>
                      <Text style={styles.guestInfoValue}>{booking.guestInfo[0].email}</Text>
                    </View>
                  </View>

                  <View style={styles.guestInfoRow}>
                    <Phone size={18} color="#666" strokeWidth={2} />
                    <View style={styles.guestInfoContent}>
                      <Text style={styles.guestInfoLabel}>Phone</Text>
                      <Text style={styles.guestInfoValue}>{booking.guestInfo[0].phone}</Text>
                    </View>
                  </View>

                  <View style={styles.guestInfoRow}>
                    <CreditCard size={18} color="#666" strokeWidth={2} />
                    <View style={styles.guestInfoContent}>
                      <Text style={styles.guestInfoLabel}>Aadhaar Number</Text>
                      <Text style={styles.guestInfoValue}>
                        XXXX XXXX {booking.guestInfo[0].aadhaarNumber.slice(-4)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guestInfoRow}>
                    <Users size={18} color="#666" strokeWidth={2} />
                    <View style={styles.guestInfoContent}>
                      <Text style={styles.guestInfoLabel}>Number of Guests</Text>
                      <Text style={styles.guestInfoValue}>{booking.guests}</Text>
                    </View>
                  </View>

                  {booking.guestInfo[0].specialRequests && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.sectionSubtitle}>Special Requests</Text>
                      <Text style={styles.specialRequests}>{booking.guestInfo[0].specialRequests}</Text>
                    </>
                  )}

                  {/* Pre-Checkin Status */}
                  {booking.customerPreferences && booking.customerPreferences.preCheckinEnabled && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.preCheckinBanner}>
                        <View style={styles.preCheckinHeader}>
                          <View style={styles.preCheckinIconContainer}>
                            <Text style={styles.preCheckinIcon}>🛡️</Text>
                          </View>
                          <View style={styles.preCheckinHeaderText}>
                            <Text style={styles.preCheckinTitle}>Pre-checkin Enabled</Text>
                            <Text style={styles.preCheckinSubtitle}>
                              Skip the front desk queue with pre-verified identity
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.preCheckinBenefits}>
                          <View style={styles.preCheckinBenefitItem}>
                            <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.preCheckinBenefitText}>Aadhaar verified</Text>
                          </View>
                          <View style={styles.preCheckinBenefitItem}>
                            <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.preCheckinBenefitText}>Identity pre-verified</Text>
                          </View>
                          <View style={styles.preCheckinBenefitItem}>
                            <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.preCheckinBenefitText}>Faster check-in process</Text>
                          </View>
                        </View>

                        {/* Customer Verification Details */}
                        {booking.customerVerification && booking.customerVerification.verified && (
                          <View style={styles.verificationDetails}>
                            <Text style={styles.verificationDetailsTitle}>Verified Customer Details</Text>
                            <View style={styles.verificationDetailRow}>
                              <Text style={styles.verificationDetailLabel}>Full Name:</Text>
                              <Text style={styles.verificationDetailValue}>
                                {booking.customerVerification.fullName}
                              </Text>
                            </View>
                            <View style={styles.verificationDetailRow}>
                              <Text style={styles.verificationDetailLabel}>Date of Birth:</Text>
                              <Text style={styles.verificationDetailValue}>
                                {booking.customerVerification.dateOfBirth}
                              </Text>
                            </View>
                            <View style={styles.verificationDetailRow}>
                              <Text style={styles.verificationDetailLabel}>Gender:</Text>
                              <Text style={styles.verificationDetailValue}>
                                {booking.customerVerification.gender}
                              </Text>
                            </View>
                            <View style={styles.verificationDetailRow}>
                              <Text style={styles.verificationDetailLabel}>Aadhaar:</Text>
                              <Text style={styles.verificationDetailValue}>
                                XXXX XXXX {booking.customerVerification.aadhaarNumber?.slice(-4)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  {/* Customer Preferences */}
                  {booking.customerPreferences && booking.customerPreferences.travelerType && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.sectionSubtitle}>Your Preferences</Text>
                      <PreferencesDisplay preferences={booking.customerPreferences} />
                    </>
                  )}
                </>
              )}
            </View>
          )}

          {selectedTab === 'payment' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Breakdown</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Room Rate (per night):</Text>
                <Text style={styles.priceValue}>₹{booking.unitPrice}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Number of Nights:</Text>
                <Text style={styles.priceValue}>{booking.nights}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Rate Calculation:</Text>
                <Text style={styles.priceValue}>₹{booking.unitPrice} × {booking.nights} nights</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal:</Text>
                <Text style={styles.priceValue}>₹{booking.totalPrice}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & Fees:</Text>
                <Text style={styles.priceValue}>₹{booking.taxesAndFees}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid:</Text>
                <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentLabel}>Payment Method:</Text>
                <Text style={styles.paymentValue}>{booking.paymentInfo.method}</Text>
              </View>
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentLabel}>Payment Status:</Text>
                <View style={[styles.statusBadgeSmall, { 
                  backgroundColor: booking.paymentInfo.status === 'pending' ? '#ffc107' : '#00BFA6' 
                }]}>
                  <Text style={styles.statusTextSmall}>{booking.paymentInfo.status}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      {booking && (
        <>
          {/* Cancel Button - Only show for pending/confirmed bookings */}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.cancelBookingButton}
                onPress={() => setShowCancelModal(true)}
              >
                <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Refund Section - Only show for cancelled bookings with payment */}
          {booking.status === 'cancelled' && booking.paymentInfo?.paymentId && (
            <View style={styles.bottomBar}>
              {loadingRefund ? (
                <View style={styles.loadingRefundContainer}>
                  <ActivityIndicator size="small" color="#00BFA6" />
                  <Text style={styles.loadingRefundText}>Checking refund status...</Text>
                </View>
              ) : refundRequest ? (
                // Show refund status if request exists
                <View style={styles.refundStatusContainer}>
                  <View style={styles.refundStatusHeader}>
                    <Text style={styles.refundStatusTitle}>Refund Request Status</Text>
                    <View style={[
                      styles.refundStatusBadge,
                      {
                        backgroundColor:
                          refundRequest.status === 'pending' ? '#FEF3C7' :
                          refundRequest.status === 'approved' ? '#D1FAE5' :
                          refundRequest.status === 'rejected' ? '#FEE2E2' :
                          '#DBEAFE'
                      }
                    ]}>
                      <Text style={[
                        styles.refundStatusBadgeText,
                        {
                          color:
                            refundRequest.status === 'pending' ? '#92400E' :
                            refundRequest.status === 'approved' ? '#065F46' :
                            refundRequest.status === 'rejected' ? '#991B1B' :
                            '#1E40AF'
                        }
                      ]}>
                        {refundRequest.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.refundStatusDetails}>
                    <View style={styles.refundStatusRow}>
                      <Text style={styles.refundStatusLabel}>Reason:</Text>
                      <Text style={styles.refundStatusValue}>{refundRequest.reason}</Text>
                    </View>
                    <View style={styles.refundStatusRow}>
                      <Text style={styles.refundStatusLabel}>Amount:</Text>
                      <Text style={styles.refundStatusValue}>₹{refundRequest.totalAmount}</Text>
                    </View>
                    <View style={styles.refundStatusRow}>
                      <Text style={styles.refundStatusLabel}>Requested:</Text>
                      <Text style={styles.refundStatusValue}>
                        {refundRequest.requestedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </Text>
                    </View>
                    {refundRequest.adminNotes && (
                      <View style={styles.refundStatusRow}>
                        <Text style={styles.refundStatusLabel}>Admin Notes:</Text>
                        <Text style={styles.refundStatusValue}>{refundRequest.adminNotes}</Text>
                      </View>
                    )}
                  </View>

                  {refundRequest.status === 'pending' && (
                    <Text style={styles.refundStatusNote}>
                      Your refund request is being reviewed. You'll be notified once it's processed.
                    </Text>
                  )}
                  {refundRequest.status === 'approved' && (
                    <Text style={[styles.refundStatusNote, { color: '#065F46' }]}>
                      Your refund has been approved and will be processed soon.
                    </Text>
                  )}
                  {refundRequest.status === 'processed' && (
                    <Text style={[styles.refundStatusNote, { color: '#1E40AF' }]}>
                      Your refund has been processed successfully.
                    </Text>
                  )}
                  {refundRequest.status === 'rejected' && (
                    <Text style={[styles.refundStatusNote, { color: '#991B1B' }]}>
                      Your refund request was rejected. Please contact support for more information.
                    </Text>
                  )}
                </View>
              ) : (
                // Show request button if no request exists
                <TouchableOpacity
                  style={styles.refundButton}
                  onPress={() => setShowRefundModal(true)}
                >
                  <Text style={styles.refundButtonText}>Request Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      {/* Cancel Booking Modal */}
      {booking && (
        <CancelBookingModal
          visible={showCancelModal}
          bookingReference={booking.reference}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelBooking}
        />
      )}

      {/* Refund Request Modal */}
      {booking && (
        <RefundRequestModal
          visible={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          bookingId={booking.id}
          bookingReference={booking.reference}
          totalAmount={booking.totalAmount}
          onRequestSubmitted={() => {
            setShowRefundModal(false);
            checkRefundRequest(booking.id);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isSmallDevice ? 24 : 40,
  },
  errorText: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: isSmallDevice ? 20 : 24,
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#00BFA6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 12 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backBtn: {
    padding: 4,
    marginRight: isSmallDevice ? 8 : 12,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingVertical: isSmallDevice ? 5 : 6,
    borderRadius: 16,
    gap: 4,
  },
  statusTextHeader: {
    color: '#fff',
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    backgroundColor: '#fff',
    padding: isSmallDevice ? 16 : isTablet ? 24 : 20,
    marginBottom: 12,
  },
  referenceLabel: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#666',
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: isSmallDevice ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 16 : 20,
  },
  bookingTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  bookingTypeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: isSmallDevice ? 8 : 12,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: isSmallDevice ? 12 : isTablet ? 20 : 16,
    borderRadius: isSmallDevice ? 10 : 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateLabel: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#666',
    marginBottom: isSmallDevice ? 6 : 8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: isSmallDevice ? 16 : 20,
  },
  timeValue: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    color: '#00BFA6',
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: isSmallDevice ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexWrap: 'wrap',
    gap: isSmallDevice ? 8 : 0,
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallDevice ? 4 : 6,
    paddingVertical: isSmallDevice ? 4 : 0,
  },
  durationText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14,
    color: '#666',
    fontWeight: '500',
  },
  hotelSection: {
    padding:5,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  imageWrapper: {
    padding:5,
    width: '100%',
    aspectRatio: 16 / 9,
    // backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelInfo: {
    padding: isSmallDevice ? 12 : isTablet ? 20 : 16,
  },
  hotelName: {
    fontSize: isSmallDevice ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallDevice ? 4 : 6,
  },
  locationText: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    color: '#666',
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: isSmallDevice ? 8 : 16,
    paddingTop: 12,
    gap: isSmallDevice ? 4 : 8,
  },
  tab: {
    flex: 1,
    paddingVertical: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 4 : 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00BFA6',
  },
  tabText: {
    fontSize: isSmallDevice ? 11 : isTablet ? 15 : 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#00BFA6',
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: isSmallDevice ? 16 : isTablet ? 24 : 20,
  },
  section: {
    marginBottom: isSmallDevice ? 16 : 20,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 12 : 16,
  },
  sectionSubtitle: {
    fontSize: isSmallDevice ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: isSmallDevice ? 12 : 16,
    marginBottom: isSmallDevice ? 10 : 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  infoLabel: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  infoBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00BFA6',
  },
  infoBoxText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  roomImageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    // backgroundColor: '#E8E8E8',
    borderRadius: isSmallDevice ? 10 : 12,
    overflow: 'hidden',
    marginBottom: isSmallDevice ? 12 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00BFA6',
  },
  roomNumber: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallDevice ? 8 : 12,
    marginHorizontal: isSmallDevice ? -2 : 0,
  },
  featureItem: {
    width: isSmallDevice ? '48%' : isTablet ? '23%' : '48%',
    backgroundColor: '#F8F9FA',
    padding: isSmallDevice ? 12 : isTablet ? 20 : 16,
    borderRadius: isSmallDevice ? 10 : 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: isSmallDevice ? 90 : 100,
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: isSmallDevice ? 10 : 11,
    color: '#999',
    marginTop: isSmallDevice ? 6 : 8,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  featureValue: {
    fontSize: isSmallDevice ? 14 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: isSmallDevice ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: isSmallDevice ? 10 : 12,
  },
  guestInfoContent: {
    flex: 1,
  },
  guestInfoLabel: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guestInfoValue: {
    fontSize: isSmallDevice ? 14 : isTablet ? 17 : 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: isSmallDevice ? 18 : 20,
  },
  specialRequests: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 8 : 10,
    gap: 12,
  },
  priceLabel: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    color: '#666',
    flex: 1,
  },
  priceValue: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 10 : 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    borderRadius: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: isSmallDevice ? 20 : isTablet ? 26 : 22,
    fontWeight: '700',
    color: '#00BFA6',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cancelBookingButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cancelBookingButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
  },
  refundButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  refundButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
  },
  loadingRefundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  loadingRefundText: {
    fontSize: 14,
    color: '#666',
  },
  refundStatusContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  refundStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  refundStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  refundStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refundStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  refundStatusDetails: {
    gap: 12,
  },
  refundStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  refundStatusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  refundStatusValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  refundStatusNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Pre-checkin styles
  preCheckinBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  preCheckinHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  preCheckinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  preCheckinIcon: {
    fontSize: 24,
  },
  preCheckinHeaderText: {
    flex: 1,
  },
  preCheckinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  preCheckinSubtitle: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  preCheckinBenefits: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  preCheckinBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preCheckinBenefitText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  verificationDetails: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  verificationDetailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6EE7B7',
  },
  verificationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  verificationDetailLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
    flex: 1,
  },
  verificationDetailValue: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
