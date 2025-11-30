import { useAuth } from '@/context/AuthContext';
import { getBookingById } from '@/services/bookingService';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  hotelDetails: {
    name: string;
    location: string;
    image: string;
  };
  roomDetails: {
    type: string;
    roomNumber: string;
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
    specialRequests: string;
  }>;
  paymentInfo: {
    method: string;
    status: string;
  };
  bookingType: string;
  createdAt: any;
}

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'details' | 'room' | 'guest' | 'payment'>('details');

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await getBookingById(id as string);
      setBooking(data as BookingDetails);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
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

          <View style={styles.datesContainer}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(booking.checkIn)}</Text>
              <Text style={styles.timeValue}>3:00 PM</Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(booking.checkOut)}</Text>
              <Text style={styles.timeValue}>11:00 AM</Text>
            </View>
          </View>

          <View style={styles.durationRow}>
            <View style={styles.durationItem}>
              <Clock size={16} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.durationText}>{booking.nights} night{booking.nights > 1 ? 's' : ''}</Text>
            </View>
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
});
