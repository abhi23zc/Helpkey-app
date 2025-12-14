import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { UserLocation } from '@/services/locationService';
import { Hotel } from '@/types/hotel';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

interface MapViewProps {
  hotels: Hotel[];
  userLocation: UserLocation | null;
  onHotelPress?: (hotelId: string) => void;
}

export default function MapView({ hotels, userLocation, onHotelPress }: MapViewProps) {
  const router = useRouter();
  const mapRef = useRef<RNMapView>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Calculate map region to fit all hotels
  const getMapRegion = () => {
    if (hotels.length === 0) {
      return {
        latitude: userLocation?.latitude || 28.6139,
        longitude: userLocation?.longitude || 77.209,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }

    const validHotels = hotels.filter((h) => h.latitude && h.longitude);
    if (validHotels.length === 0) {
      return {
        latitude: userLocation?.latitude || 28.6139,
        longitude: userLocation?.longitude || 77.209,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }

    const latitudes = validHotels.map((h) => h.latitude!);
    const longitudes = validHotels.map((h) => h.longitude!);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding to ensure markers aren't cut off
    const latDelta = (maxLat - minLat) * 1.8 || 0.5;
    const lngDelta = (maxLng - minLng) * 1.8 || 0.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.15),
      longitudeDelta: Math.max(lngDelta, 0.15),
    };
  };

  const handleMarkerPress = (hotel: Hotel) => {
    setSelectedHotel(hotel);
  };

  const handleCardPress = (hotelId: string) => {
    router.push(`/hotel/${hotelId}`);
    if (onHotelPress) {
      onHotelPress(hotelId);
    }
  };

  // City coordinates fallback
  const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'New Delhi': { lat: 28.6139, lng: 77.2090 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Gurgaon': { lat: 28.4595, lng: 77.0266 },
    'Gurugram': { lat: 28.4595, lng: 77.0266 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Goa': { lat: 15.2993, lng: 74.1240 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  };

  // Add fallback coordinates for hotels without lat/lng
  const hotelsWithCoords = hotels.map((hotel, index) => {
    if (hotel.latitude && hotel.longitude) {
      return hotel;
    }

    // Try to find city coordinates
    const city = hotel.city || hotel.location || '';
    const coords = cityCoordinates[city];

    if (coords) {
      // Add small random offset to prevent exact overlap
      const offset = index * 0.002;
      return {
        ...hotel,
        latitude: coords.lat + offset,
        longitude: coords.lng + offset,
      };
    }

    return hotel;
  });

  const validHotels = hotelsWithCoords.filter((h) => h.latitude && h.longitude);

  console.log('MAP DEBUG - Total hotels:', hotels.length, 'Valid:', validHotels.length);

  return (
    <View style={styles.container}>
      <RNMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getMapRegion()}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapPadding={{ top: 60, right: 60, bottom: 80, left: 60 }}
      >
        {validHotels.map((hotel) => {
          const isSelected = selectedHotel?.id === hotel.id;
          return (
            <Marker
              key={hotel.id}
              coordinate={{
                latitude: hotel.latitude!,
                longitude: hotel.longitude!,
              }}
              onPress={() => handleMarkerPress(hotel)}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, isSelected && styles.markerSelected]}>
                  <Text style={styles.markerText}>₹{hotel.price}</Text>
                </View>
                {isSelected && <View style={styles.markerArrow} />}
              </View>
              <Text style={styles.markerText}>₹{hotel.price}</Text>
            </Marker>
          );
        })}
      </RNMapView>

      {/* Hotel Card Overlay */}
      {selectedHotel && (
        <View style={styles.cardOverlay}>
          <TouchableOpacity
            style={styles.hotelCard}
            onPress={() => handleCardPress(selectedHotel.id)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: selectedHotel.image }}
              style={styles.hotelImage}
              contentFit="cover"
            />
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName} numberOfLines={1}>
                {selectedHotel.name}
              </Text>
              <View style={styles.hotelLocation}>
                <MapPin size={12} color="#666" strokeWidth={2} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {selectedHotel.location}
                </Text>
              </View>
              <View style={styles.hotelBottom}>
                <Text style={styles.hotelPrice}>₹{selectedHotel.price.toLocaleString('en-IN')}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {selectedHotel.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedHotel(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <Text style={styles.hotelCount}>{validHotels.length} hotels</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF4757',
    marginTop: -2,
  },
  marker: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',

    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  markerSelected: {
    backgroundColor: '#FF4757',
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  markerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',

  },
  cardOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 110,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  hotelImage: {
    width: 90,
    height: 110,
  },
  hotelInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
    lineHeight: 18,
  },
  hotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    lineHeight: 14,
  },
  hotelBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  hotelPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0066FF',
  },
  ratingBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
  hotelCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  noHotelsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noHotelsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
