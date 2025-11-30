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
  XCircle
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



interface Booking {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  hotelDetails: {
    name: string;
    location: string;
    image: string;
  };
  roomDetails: {
    type: string;
    roomNumber: string;
  };
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
        return bookings.filter(b => isUpcoming(b.checkIn) && b.status !== 'cancelled');
      case 'completed':
        return bookings.filter(b => isCompleted(b.checkOut) || b.status === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings();

  const renderBookingCard = (booking: Booking) => {
    const StatusIcon = getStatusIcon(booking.status);
    const statusColor = getStatusColor(booking.status);

    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => {
          router.push(`/booking/${booking.id}` as any);
        }}
      >
        {/* Hotel Image */}
        <View style={styles.imageContainer}>
          {booking.hotelDetails?.image ? (
            <Image
              source={{ uri: booking.hotelDetails.image.replace(/\.avif$/, '.jpg') }}
              style={styles.hotelImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MapPin size={40} color="#CCC" strokeWidth={1.5} />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <StatusIcon size={12} color="#fff" strokeWidth={2.5} />
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.bookingInfo}>
          {/* Hotel Name & Location */}
          <View style={styles.headerRow}>
            <View style={styles.hotelNameContainer}>
              <Text style={styles.hotelName} numberOfLines={1}>
                {booking.hotelDetails.name}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#666" strokeWidth={2} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {booking.hotelDetails.location}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </View>

          {/* Room Type */}
          <View style={styles.roomTypeRow}>
            <Text style={styles.roomType}>{booking.roomDetails.type}</Text>
            {booking.roomDetails.roomNumber && (
              <Text style={styles.roomNumber}>Room {booking.roomDetails.roomNumber}</Text>
            )}
          </View>

          {/* Dates & Guests */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Calendar size={14} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.detailText}>
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Clock size={14} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.detailText}>{booking.nights} night{booking.nights > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.detailItem}>
              <User size={14} color="#00BFA6" strokeWidth={2} />
              <Text style={styles.detailText}>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Price & Reference */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.referenceLabel}>Booking ID</Text>
              <Text style={styles.referenceText}>{booking.reference}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{booking.totalAmount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    // If user is not logged in
    if (!user) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <User size={64} color="#E0E0E0" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in to view and manage your bookings
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/auth/login' as any)}
          >
            <Text style={styles.exploreButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emptyMessages = {
      all: {
        title: 'No Bookings Yet',
        subtitle: 'Start exploring and book your perfect stay',
        icon: Calendar,
      },
      upcoming: {
        title: 'No Upcoming Bookings',
        subtitle: 'Book your next adventure today',
        icon: Calendar,
      },
      completed: {
        title: 'No Completed Bookings',
        subtitle: 'Your booking history will appear here',
        icon: CheckCircle,
      },
      cancelled: {
        title: 'No Cancelled Bookings',
        subtitle: 'You have no cancelled bookings',
        icon: XCircle,
      },
    };

    const message = emptyMessages[selectedTab];
    const EmptyIcon = message.icon;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <EmptyIcon size={64} color="#E0E0E0" strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptySubtitle}>{message.subtitle}</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.exploreButtonText}>Explore Hotels</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          {user && (
            <Text style={styles.headerSubtitle}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFA6" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : !user || bookings.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
                onPress={() => setSelectedTab('all')}
              >
                <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
                  All ({bookings.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
                onPress={() => setSelectedTab('upcoming')}
              >
                <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
                  Upcoming ({bookings.filter(b => isUpcoming(b.checkIn) && b.status !== 'cancelled').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
                onPress={() => setSelectedTab('completed')}
              >
                <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
                  Completed ({bookings.filter(b => isCompleted(b.checkOut) || b.status === 'completed').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, selectedTab === 'cancelled' && styles.tabActive]}
                onPress={() => setSelectedTab('cancelled')}
              >
                <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.tabTextActive]}>
                  Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Bookings List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#00BFA6"
                colors={['#00BFA6']}
              />
            }
          >
            {filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingCard)
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        </>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#00BFA6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#E8E8E8',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bookingInfo: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  roomTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  roomType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFA6',
  },
  roomNumber: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  referenceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  referenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00BFA6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#00BFA6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
