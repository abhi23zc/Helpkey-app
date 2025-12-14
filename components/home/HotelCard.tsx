import { Hotel } from '@/types/hotel';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <TouchableOpacity style={styles.hotelCard} activeOpacity={0.9} onPress={handlePress}>
      <Image
        source={{ uri: hotel.image.replace(/\.avif$/, '.jpg') }}
        contentFit="cover"
        transition={200}
        style={styles.hotelImage}
      />
      {hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercent}% OFF</Text>
        </View>
      )}
      {showHourlyBadge && hasHourlyRooms && (
        <View style={styles.hourlyBadge}>
          <Text style={styles.hourlyBadgeText}>HOURLY</Text>
        </View>
      )}
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <View style={styles.locationRow}>
          <Text style={styles.hotelLocation} numberOfLines={1}>
            {hotel.location}
          </Text>
          {showDistance && hotel.distance !== undefined && (
            <Text style={styles.distanceText}>• {hotel.distance.toFixed(1)} km</Text>
          )}
        </View>
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
          <View style={styles.googleRating}>
            <Text style={styles.ratingScore}>{hotel.rating.toFixed(1)}/5</Text>
            <Image
              source={{
                uri: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_74x24dp.png',
              }}
              contentFit="contain"
              style={styles.googleLogo}
            />
            <Text style={styles.reviewCount}>{hotel.reviews} ratings</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CARD_WIDTH = 280;
const CARD_HEIGHT = CARD_WIDTH * 0.75;

const styles = StyleSheet.create({
  hotelCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 4,
  },
  hotelImage: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: '#f0f0f0',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  hourlyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hourlyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  hotelLocation: {
    fontSize: 13,
    color: '#666',
  },
  distanceText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  hotelBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  hotelPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  perNight: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  googleRating: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066FF',
  },
  googleLogo: {
    width: 50,
    height: 16,
  },
  reviewCount: {
    fontSize: 11,
    color: '#666',
  },
});

export default HotelCard;
