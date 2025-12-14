import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  User,
  UtensilsCrossed,
  Waves,
  Wifi
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import RoomCard from '@/components/hotel/RoomCard';
import { db } from '@/config/firebase';
import { Hotel, Review, Room } from '@/types/hotel';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.35;
const isSmallDevice = width < 375;

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
        console.log('🏨 Hotel Data from Firebase:', {
          id: hotelDoc.id,
          name: hotelData.name,
          image: hotelData.image,
          images: hotelData.images,
          imagesLength: hotelData.images?.length,
          firstImage: hotelData.images?.[0],
          hotelAdmin: hotelData.hotelAdmin,
          userId: hotelData.userId,
          allFields: Object.keys(hotelData)
        });

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
    console.log('Share hotel');
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
      console.log('📤 Passing hotel data to booking:', hotelDataToPass);
      
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
        <ActivityIndicator size="large" color="#00BFA6" />
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

  // Convert .avif to .jpg for React Native compatibility
  const rawImages = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.image];
  const displayImages = rawImages.map(img => img.replace(/\.avif$/, '.jpg'));
  const minPrice = selectedRoom ? selectedRoom.price : (hotel.price || 0);
  const displayRating = averageRating > 0 ? averageRating : hotel.rating;
  const displayReviewCount = totalReviews > 0 ? totalReviews : hotel.reviews || hotel.reviewCount || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayImages[selectedImageIndex] }}
            style={styles.mainImage}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
            placeholderContentFit="cover"
          />

          {/* Header Buttons */}
          <SafeAreaView style={styles.headerButtons} edges={['top']}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#333" strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Share2 size={20} color="#333" strokeWidth={2.5} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Image Thumbnails */}
          {displayImages.length > 1 && (
            <View style={styles.thumbnailContainer}>
              <FlatList
                data={displayImages.slice(0, 4)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedImageIndex(index)}
                    style={[styles.thumbnail, selectedImageIndex === index && styles.thumbnailActive]}
                  >
                    <Image source={{ uri: item }} style={styles.thumbnailImage} contentFit="cover" />
                    {index === 3 && displayImages.length > 4 && (
                      <View style={styles.thumbnailOverlay}>
                        <Text style={styles.thumbnailOverlayText}>{displayImages.length - 3}+</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Hotel Info */}
        <View style={styles.contentContainer}>
          {/* Title and Favorite */}
          <View style={styles.titleRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <TouchableOpacity
              style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
              onPress={handleFavorite}
            >
              <Heart
                size={22}
                color={isFavorite ? '#fff' : '#FF4757'}
                fill={isFavorite ? '#FF4757' : 'none'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin size={16} color="#666" strokeWidth={2} />
            <Text style={styles.locationText}>{hotel.address || hotel.location}</Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                color="#FFB800"
                fill={i < Math.floor(displayRating) ? '#FFB800' : 'none'}
                strokeWidth={0}
              />
            ))}
            <Text style={styles.ratingText}>{displayRating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>• {displayReviewCount} reviews</Text>
          </View>

          {/* Property Facilities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Property Facilities</Text>
              {hotel.amenities && hotel.amenities.length > 5 && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/hotel/amenities',
                      params: {
                        amenities: JSON.stringify(hotel.amenities),
                        hotelName: hotel.name,
                      },
                    })
                  }
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.facilitiesGrid}>
              {hotel.amenities && hotel.amenities.length > 0 ? (
                hotel.amenities.slice(0, 5).map((amenity, index) => {
                  const amenityStr = typeof amenity === 'string' ? amenity : String(amenity || '');
                  const IconComponent = amenityIcons[amenityStr] || Wifi;
                  return (
                    <View key={index} style={styles.facilityItem}>
                      <View style={styles.facilityIcon}>
                        <IconComponent size={22} color="#00BFA6" strokeWidth={2} />
                      </View>
                      <Text style={styles.facilityText} numberOfLines={2}>
                        {amenityStr.replace(/-/g, ' ')}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No facilities listed</Text>
              )}
            </View>
          </View>

          {/* Choose Room Section */}
          {hotel.rooms && hotel.rooms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Room</Text>
              <View style={{ marginTop: 16 }}>
                {hotel.rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onSelect={setSelectedRoom}
                    isSelected={selectedRoom?.id === room.id}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription
                ? hotel.description
                : hotel.description && hotel.description.length > 150
                  ? `${hotel.description.substring(0, 150)}...`
                  : hotel.description || 'No description available.'}
              {hotel.description && hotel.description.length > 150 && (
                <Text style={styles.readMoreText} onPress={() => setShowFullDescription(!showFullDescription)}>
                  {' '}
                  {showFullDescription ? 'Read less' : 'Read more'}
                </Text>
              )}
            </Text>
          </View>

          {/* Map Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Map</Text>
              <TouchableOpacity onPress={handleOpenMap}>
                <Text style={styles.openMapText}>Open map</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: hotel.latitude || 28.6139,
                  longitude: hotel.longitude || 77.209,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: hotel.latitude || 28.6139,
                    longitude: hotel.longitude || 77.209,
                  }}
                  title={hotel.name}
                  description={hotel.address}
                />
              </MapView>
              <TouchableOpacity style={styles.mapOverlay} onPress={handleOpenMap} activeOpacity={0.9} />
            </View>
          </View>

          {/* Ratings & Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
              {reviews.length > 0 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
              <View style={styles.ratingScoreContainer}>
                <Text style={styles.ratingScore}>{displayRating.toFixed(1)}</Text>
                <View style={styles.ratingStarsSmall}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color="#FFB800"
                      fill={i < Math.floor(displayRating) ? '#FFB800' : 'none'}
                      strokeWidth={0}
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>{displayReviewCount} reviews</Text>
              </View>
            </View>

            {/* Reviews List */}
            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#00BFA6" style={{ marginTop: 20 }} />
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserIcon}>
                        <User size={20} color="#666" strokeWidth={2} />
                      </View>
                      <View style={styles.reviewUserInfo}>
                        <Text style={styles.reviewUserName}>{review?.userEmail?.split("@")[0] || 'Anonymous'}</Text>
                        <View style={styles.reviewRatingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              color="#FFB800"
                              fill={i < review.rating ? '#FFB800' : 'none'}
                              strokeWidth={0}
                            />
                          ))}
                          <Text style={styles.reviewDate}>• {formatDate(review.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.comment}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No reviews yet</Text>
            )}
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>
            ₹{minPrice}
            <Text style={styles.priceUnit}> /night</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow} activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
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
  thumbnailContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  thumbnailActive: {
    borderColor: '#fff',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  hotelName: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 12,
    letterSpacing: -0.5,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#FF4757',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 3,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  reviewsText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFA6',
  },
  openMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  facilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  readMoreText: {
    color: '#00BFA6',
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ratingSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  ratingScoreContainer: {
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingStarsSmall: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  ratingCount: {
    fontSize: 13,
    color: '#666',
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  reviewUserIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
    marginLeft: 16,
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
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
