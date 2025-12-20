import { Hotel } from '@/types/hotel';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';

interface HotelCardProps {
  hotel: Hotel;
  showHourlyBadge?: boolean;
  showDistance?: boolean;
}

const HotelCard = ({ hotel, showHourlyBadge, showDistance }: HotelCardProps) => {
  const router = useRouter();
  const hasDiscount = hotel.originalPrice > hotel.price;
  const discountPercent = hasDiscount
    ? Math.round(((hotel.originalPrice - hotel.price) / hotel.originalPrice) * 100)
    : 0;

  const hasHourlyRooms = hotel.rooms.some(
    (room) => room.bookingType === 'hourly' || room.bookingType === 'both'
  );

  const hourlyRoom = hotel.rooms.find(
    (room) => (room.bookingType === 'hourly' || room.bookingType === 'both') && room.hourlyPrice > 0
  );

  const handlePress = () => {
    router.push(`/hotel/${hotel.id}`);
  };

  return (
    <TouchableOpacity style={styles.hotelCard} activeOpacity={0.85} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: hotel.image.replace(/\.avif$/, '.jpg') }}
          contentFit="cover"
          transition={300}
          style={styles.hotelImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10, 14, 39, 0.4)', 'rgba(10, 14, 39, 0.95)']}
          style={styles.imageGradient}
          locations={[0, 0.5, 1]}
        />

        {hasDiscount && (
          <View style={styles.discountBadge}>
            <LinearGradient
              colors={['#FF6B6B', '#FF3B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </LinearGradient>
          </View>
        )}

        {showHourlyBadge && hasHourlyRooms && (
          <View style={styles.hourlyBadge}>
            <LinearGradient
              colors={['#34C759', '#28A745']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Text style={styles.hourlyBadgeText}>⚡ HOURLY</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.hotelInfo}>
        <View style={styles.glassCard}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {hotel.name}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#00D9FF" />
            <Text style={styles.hotelLocation} numberOfLines={1}>
              {hotel.location}
            </Text>
            {showDistance && hotel.distance !== undefined && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{hotel.distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.hotelBottom}>
            <View>
              <View style={styles.priceRow}>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>₹{hotel.originalPrice.toLocaleString('en-IN')}</Text>
                )}
                <Text style={styles.hotelPrice}>₹{hotel.price.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.perNight}>
                {showHourlyBadge && hourlyRoom ? 'per hour' : 'per night'}
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              <View style={styles.ratingBadge}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingScore}>{hotel.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewCount}>{hotel.reviews} reviews</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CARD_WIDTH = 290;
const CARD_HEIGHT = CARD_WIDTH * 0.75;

const styles = StyleSheet.create({
  hotelCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(26, 31, 58, 0.6)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_HEIGHT,
  },
  hotelImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1f3a',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  discountBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  discountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hourlyBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  hourlyBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotelInfo: {
    padding: 14,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hotelName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  hotelLocation: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  distanceBadge: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  distanceText: {
    fontSize: 11,
    color: '#00D9FF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  hotelBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  hotelPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00D9FF',
    letterSpacing: 0.3,
  },
  perNight: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 3,
    fontWeight: '500',
  },
  ratingContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
});

export default HotelCard;
