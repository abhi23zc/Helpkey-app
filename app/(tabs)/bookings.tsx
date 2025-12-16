import { useAuth } from '@/context/AuthContext';
import { getUserBookings } from '@/services/bookingService';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  User,
  XCircle,
  CreditCard,
  Phone,
  Mail,
  MoreVertical,
  Star
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';

const { width } = Dimensions.get('window');

interface Booking {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  totalPrice: number;
  taxesAndFees: number;
  unitPrice: number;
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
    image: string;
    beds: string;
    size: string;
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

export default function Bookings() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getUserBookings(user?.uid || '');
      // Sort by creation date (newest first)
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setBookings(sortedData as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#15803D', icon: '#15803D' };
      case 'confirmed':
        return { bg: '#F3F4F6', text: '#111827', icon: '#111827' };
      case 'pending':
        return { bg: '#FEF9C3', text: '#A16207', icon: '#A16207' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', icon: '#B91C1C' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', icon: '#6B7280' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return CheckCircle;
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUpcoming = (checkIn: string) => {
    return new Date(checkIn) > new Date();
  };

  const isCompleted = (checkOut: string) => {
    return new Date(checkOut) < new Date();
  };

  const filterBookings = () => {
    switch (selectedTab) {
      case 'upcoming':
        return bookings.filter(b => isUpcoming(b.checkIn) && b.status.toLowerCase() !== 'cancelled');
      case 'completed':
        return bookings.filter(b => isCompleted(b.checkOut) || b.status.toLowerCase() === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.status.toLowerCase() === 'cancelled');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings();

  const renderBookingCard = (booking: Booking, index: number) => {
    const StatusIcon = getStatusIcon(booking.status);
    const statusStyle = getStatusColor(booking.status);

    return (
      <MotiView
        key={booking.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 100 } as any}
      >
        <TouchableOpacity
          style={styles.bookingCard}
          activeOpacity={0.9}
          onPress={() => {
            router.push(`/booking/${booking.id}` as any);
          }}
        >
          {/* Card Header - Image & Status */}
          <View style={styles.cardHeader}>
            {booking.hotelDetails?.image ? (
              <Image
                source={{ uri: booking.hotelDetails.image.replace(/\.avif$/, '.jpg') }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MapPin size={32} color="#9CA3AF" />
              </View>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <StatusIcon size={12} color={statusStyle.icon} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{booking.status}</Text>
            </View>
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName} numberOfLines={1}>{booking.hotelDetails.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>{booking.hotelDetails.location}</Text>
              </View>
            </View>

            {/* Room Info Tag */}
            <View style={styles.roomTag}>
              <Text style={styles.roomTagText}>{booking.roomDetails.type}</Text>
            </View>

            <View style={styles.divider} />

            {/* Booking Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconBox}>
                  <Calendar size={14} color="#111827" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{formatDate(booking.checkIn)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={[styles.detailIconBox, { backgroundColor: '#F0FDFA' }]}>
                  <Clock size={14} color="#111827" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {booking.bookingType === 'hourly'
                      ? `${booking.hourlyDuration || 0} Hours`
                      : `${booking.nights} Night${booking.nights > 1 ? 's' : ''}`
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Price & Action */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.totalPriceLabel}>Total Amount</Text>
                <Text style={styles.totalPrice}>₹{booking.totalAmount}</Text>
              </View>

              <View style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Details</Text>
                <ChevronRight size={16} color="#111827" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderEmptyState = () => {
    if (!user) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <User size={48} color="#9CA3AF" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Log in to see bookings</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to access your upcoming and past trips history.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth/login' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emptyMessages = {
      all: {
        title: 'No Bookings Found',
        subtitle: 'Looks like you haven\'t booked any stays yet.',
      },
      upcoming: {
        title: 'No Upcoming Trips',
        subtitle: 'You have no confirmed upcoming bookings.',
      },
      completed: {
        title: 'No Past Stays',
        subtitle: 'Your completed bookings will appear here.',
      },
      cancelled: {
        title: 'No Cancellations',
        subtitle: 'You haven\'t cancelled any bookings.',
      },
    };

    const message = emptyMessages[selectedTab];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Calendar size={48} color="#9CA3AF" strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptySubtitle}>{message.subtitle}</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/home')}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreButtonText}>Explore Hotels</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          {user && (
            <Text style={styles.headerSubtitle}>
              You have {bookings.length} total bookings
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    selectedTab === tab.id && styles.tabActive
                  ]}
                  onPress={() => setSelectedTab(tab.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabText,
                    selectedTab === tab.id && styles.tabTextActive
                  ]}>
                    {tab.label}
                    {tab.id !== 'all' && (
                      <Text style={{ fontSize: 10, opacity: 0.8 }}> ({
                        tab.id === 'upcoming'
                          ? bookings.filter(b => isUpcoming(b.checkIn) && b.status.toLowerCase() !== 'cancelled').length
                          : tab.id === 'completed'
                            ? bookings.filter(b => isCompleted(b.checkOut) || b.status.toLowerCase() === 'completed').length
                            : tab.id === 'cancelled'
                              ? bookings.filter(b => b.status.toLowerCase() === 'cancelled').length
                              : 0
                      })</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#111827"
                colors={['#111827']}
              />
            }
          >
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => renderBookingCard(booking, index))
            ) : (
              renderEmptyState()
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Gray 50
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: '#FFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#F3F4F6', // Gray 50
    borderColor: '#E5E7EB', // Gray 200
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827', // Black
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  // Card
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    height: 150,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Card Content
  cardContent: {
    padding: 16,
  },
  hotelInfo: {
    marginBottom: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  roomTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  roomTagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6', // Gray 100
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalPriceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
