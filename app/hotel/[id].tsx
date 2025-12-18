import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import {
  AirVent,
  ArrowLeft,
  Car,
  Coffee,
  Dumbbell,
  Heart,
  MapPin,
  Share2,
  Star,
  Tv,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  ChevronRight,
  Info
} from 'lucide-react-native';
import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import RoomCard from '@/components/hotel/RoomCard';
import { db } from '@/config/firebase';
import { Hotel, Review, Room } from '@/types/hotel';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.45;

const amenityIcons: { [key: string]: any } = {
  'Free WiFi': Wifi,
  WiFi: Wifi,
  'Swimming Pool': Waves,
  Pool: Waves,
  Gym: Dumbbell,
  'Air Conditioning': AirVent,
  AC: AirVent,
  Restaurant: UtensilsCrossed,
  Parking: Car,
  parking: Car,
  TV: Tv,
  Spa: Coffee,
  Beach: Waves,
  Bar: Coffee,
  'private-balcony': Wifi,
};

export default function HotelDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchHotelDetails();
    fetchReviews();
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      const hotelDoc = await getDoc(doc(db, 'hotels', id as string));

      if (hotelDoc.exists()) {
        const hotelData = hotelDoc.data();

        // Fetch rooms
        const roomsQuery = query(collection(db, 'rooms'), where('hotelId', '==', id));
        const roomsSnapshot = await getDocs(roomsQuery);
        const rooms = roomsSnapshot.docs.map((doc) => {
          const roomData = doc.data();
          return {
            id: doc.id,
            type: roomData.roomType || roomData.type || 'Standard Room',
            roomType: roomData.roomType || 'Standard Room',
            price: roomData.price || 0,
            hourlyPrice: (roomData.hourlyRates && roomData.hourlyRates.length > 0) ? roomData.hourlyRates[0].price : (roomData.hourlyPrice || 0),
            hourlyRates: roomData.hourlyRates || [],
            bookingType: roomData.bookingType || 'nightly',
            size: roomData.size || '',
            beds: roomData.beds || '',
            capacity: roomData.capacity || 2,
            image: (roomData.images && roomData.images.length > 0) ? roomData.images[0] : (roomData.image || null),
            images: roomData.images || [],
            amenities: roomData.amenities || [],
            originalPrice: roomData.originalPrice || roomData.price || 0,
            roomNumber: roomData.roomNumber || '',
            status: roomData.status || 'Available',
          };
        });

        const processedHotel: Hotel = {
          id: hotelDoc.id,
          name: hotelData.name || 'Hotel',
          location: hotelData.location || '',
          address: hotelData.address || hotelData.location || '',
          city: hotelData.city || '',
          price: hotelData.price || 0,
          originalPrice: hotelData.originalPrice || hotelData.price || 0,
          rating: hotelData.rating || 0,
          reviews: typeof hotelData.reviews === 'number' ? hotelData.reviews : 0,
          reviewCount: hotelData.reviewCount || 0,
          stars: hotelData.stars || 3,
          image:
            hotelData.image ||
            (Array.isArray(hotelData.images) && hotelData.images.length > 0 ? hotelData.images[0] : null) ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          images:
            Array.isArray(hotelData.images) && hotelData.images.length > 0
              ? hotelData.images
              : [hotelData.image ||
                (Array.isArray(hotelData.images) && hotelData.images.length > 0 ? hotelData.images[0] : null) ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
          videos: hotelData.videos || [],
          amenities: Array.isArray(hotelData.amenities) ? hotelData.amenities : [],
          description: hotelData.description || 'No description available.',
          email: hotelData.email || '',
          phone: hotelData.phone || '',
          approved: hotelData.approved || false,
          status: hotelData.status || 'active',
          rooms: rooms || [],
          policies: hotelData.policies || {},
          latitude: hotelData.latitude || 28.6139,
          longitude: hotelData.longitude || 77.209,
          distance: hotelData.distance,
          available: hotelData.available !== false,
          hotelAdmin: hotelData.hotelAdmin || hotelData.userId || '',
        };

        setHotel(processedHotel);
        if (rooms.length > 0) {
          setSelectedRoom(rooms[0]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hotel:', error);
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('hotelId', '==', id),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];

      setReviews(reviewsData);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / reviewsData.length;
        setAverageRating(Math.round(avgRating * 10) / 10);
        setTotalReviews(reviewsData.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleShare = () => {
    // Implement share logic
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleBookNow = () => {
    if (selectedRoom && hotel) {
      const hotelDataToPass = {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        address: hotel.address,
        image: hotel.image,
        rating: hotel.rating,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        hotelAdmin: hotel.hotelAdmin || '',
      };

      router.push({
        pathname: '/hotel/booking',
        params: {
          hotel: JSON.stringify(hotelDataToPass),
          room: JSON.stringify(selectedRoom),
        },
      });
    } else {
      console.log('No room selected');
    }
  };

  const handleOpenMap = () => {
    if (hotel?.latitude && hotel?.longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${hotel.name}@${hotel.latitude},${hotel.longitude}`,
        android: `geo:0,0?q=${hotel.latitude},${hotel.longitude}(${hotel.name})`,
      });
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Hotel not found</Text>
      </View>
    );
  }

  // Prepare media items (videos + images)
  const rawImages = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.image];
  const displayImages = rawImages.map(img => img.replace(/\.avif$/, '.jpg'));
  const displayVideos = hotel.videos || [];

  const mediaItems = [
    ...displayVideos.map(uri => ({ type: 'video', uri })),
    ...displayImages.map(uri => ({ type: 'image', uri }))
  ];

  const minPrice = selectedRoom ? selectedRoom.price : (hotel.price || 0);
  const displayRating = averageRating > 0 ? averageRating : hotel.rating;
  const displayReviewCount = totalReviews > 0 ? totalReviews : hotel.reviews || hotel.reviewCount || 0;

  // Animation values
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
    outputRange: [IMAGE_HEIGHT / 2, 0, -IMAGE_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated Header Background */}
      <Animated.View style={[styles.headerBackground, { opacity: headerOpacity, height: insets.top + 60 }]} />

      {/* Fixed Header Buttons */}
      <SafeAreaView style={styles.headerButtons} edges={['top']}>
        <TouchableOpacity style={styles.glassButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={[styles.glassButton, { marginRight: 10 }]} onPress={handleShare}>
            <Share2 size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassButton} onPress={handleFavorite}>
            <Heart
              size={20}
              color={isFavorite ? '#FF4757' : '#FFF'}
              fill={isFavorite ? '#FF4757' : 'none'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        bounces={false}
      >
        {/* Parallax Image/Video Hero */}
        <View style={styles.imageContainer}>
          <Animated.View style={[styles.parallaxImage, { transform: [{ translateY: imageTranslateY }] }]}>
            <FlatList
              data={mediaItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              onMomentumScrollEnd={(event: any) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
              renderItem={({ item, index }) => {
                if (item.type === 'video') {
                  return (
                    <View style={{ width, height: '100%' }}>
                      <Video
                        source={{ uri: item.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={index === selectedImageIndex}
                        isLooping
                        isMuted
                        useNativeControls={false}
                      />
                    </View>
                  );
                }
                return (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: width, height: '100%' }}
                    contentFit="cover"
                    transition={300}
                  />
                );
              }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
              pointerEvents="none"
            />
          </Animated.View>

          {/* Media Indicators/Dots */}
          <View style={styles.galleryIndicator}>
            {mediaItems.length > 1 && (
              <View style={styles.dotsContainer}>
                {mediaItems.slice(0, 5).map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === selectedImageIndex ? styles.activeDot : styles.inactiveDot,
                      item.type === 'video' && idx !== selectedImageIndex && { backgroundColor: 'rgba(255, 100, 100, 0.5)' } // Subtle hint for video
                    ]}
                  />
                ))}
                {mediaItems.length > 5 && <View style={styles.dotSmall} />}
              </View>
            )}
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentContainer}>

          {/* Title & Info */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 } as any}
          >
            <View style={styles.mainInfo}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>{hotel.address || hotel.location}</Text>
              </View>

              <View style={styles.ratingBadgeContainer}>
                <View style={styles.ratingBadge}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingValue}>{displayRating.toFixed(1)}</Text>
                </View>
                <Text style={styles.reviewCountText}>({displayReviewCount} reviews)</Text>
              </View>
            </View>
          </MotiView>

          <View style={styles.divider} />

          {/* Description */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100, type: 'timing', duration: 500 } as any}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>About this place</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription
                ? hotel.description
                : hotel.description && hotel.description.length > 150
                  ? `${hotel.description.substring(0, 150)}...`
                  : hotel.description || 'No description available.'}
            </Text>
            {hotel.description && hotel.description.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMoreText}>{showFullDescription ? 'Read less' : 'Read more'}</Text>
              </TouchableOpacity>
            )}
          </MotiView>

          {/* Facilities */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, type: 'timing', duration: 500 } as any}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What this place offers</Text>
              {hotel.amenities && hotel.amenities.length > 4 && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/hotel/amenities', params: { amenities: JSON.stringify(hotel.amenities), hotelName: hotel.name } })}>
                  <Text style={styles.seeAllText}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
              {hotel.amenities && hotel.amenities.slice(0, 8).map((amenity, index) => {
                const amenityStr = String(amenity);
                const Icon = amenityIcons[amenityStr] || Info;
                return (
                  <View key={index} style={styles.amenityChip}>
                    <View style={styles.amenityIconBox}>
                      <Icon size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.amenityText}>{amenityStr}</Text>
                  </View>
                )
              })}
            </ScrollView>
          </MotiView>

          {/* Room Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: 'timing', duration: 500 } as any}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Choose your room</Text>
            <View style={{ gap: 16 }}>
              {hotel.rooms && hotel.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={setSelectedRoom}
                  isSelected={selectedRoom?.id === room.id}
                />
              ))}
              {(!hotel.rooms || hotel.rooms.length === 0) && (
                <Text style={styles.noDataText}>No rooms available at the moment.</Text>
              )}
            </View>
          </MotiView>

          {/* Map */}
          <MotiView
            style={styles.section}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 400, type: 'timing', duration: 500 } as any}
          >
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: hotel.latitude || 28.6139,
                  longitude: hotel.longitude || 77.209,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: hotel.latitude || 28.6139,
                    longitude: hotel.longitude || 77.209,
                  }}
                >
                  <View style={styles.customMarker}>
                    <MapPin size={24} color="#FFF" fill="#111827" />
                  </View>
                </Marker>
              </MapView>
              <TouchableOpacity style={styles.mapOverlay} onPress={handleOpenMap}>
                <View style={styles.viewMapButton}>
                  <Text style={styles.viewMapText}>Get Directions</Text>
                </View>
              </TouchableOpacity>
            </View>
          </MotiView>

        </View>
      </Animated.ScrollView>

      {/* Floating Bottom Bar */}
      <MotiView
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        transition={{ delay: 600, type: 'spring', damping: 20 } as any}
        style={styles.bottomContainer}
      >
        <View style={styles.bottomBarContent}>
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>₹</Text>
              <Text style={styles.priceValue}>{minPrice}</Text>
            </View>
            <Text style={styles.priceLabel}>Total price for 1 night</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookNow}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
            <ChevronRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </MotiView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },

  // Header Styles
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRightButtons: {
    flexDirection: 'row',
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Image Parallax
  imageContainer: {
    height: IMAGE_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  parallaxImage: {
    width: '100%',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#FFF',
    width: 12,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Content
  contentContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 20,
    paddingTop: 30,
    minHeight: height - IMAGE_HEIGHT,
  },
  mainInfo: {
    marginBottom: 20,
  },
  hotelName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  ratingBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewCountText: {
    color: '#6B7280',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Description
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  readMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },

  // Amenities
  amenityChip: {
    alignItems: 'center',
    width: 70,
  },
  amenityIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityText: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Map
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    padding: 4,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMapButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewMapText: {
    fontWeight: '600',
    color: '#111827',
  },

  // Bottom Bar
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  priceSection: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});
