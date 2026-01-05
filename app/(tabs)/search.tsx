import React, { useState, useEffect, useCallback } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Heart, Clock, Wifi, Car, X, Search as SearchIcon, RotateCcw, Moon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';

import InlineLocationSearch from '../../components/InlineLocationSearch';
import { Hotel } from '../../types/hotel';
import {
  getSearchHistory,
  addToSearchHistory,
  getRecentlyViewed,
  addToRecentlyViewed,
  getFavorites,
  toggleFavorite as toggleFavoriteService,
  getRecommendedHotels,
  searchHotelsByLocation,
  RecentlyViewedItem
} from '../../services/simpleSearchService';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Helper function to safely get numeric values
const getSafeNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

// Helper function to create mock location from search term
const createMockLocationFromSearchTerm = (cityName: string) => {
  const cityCoordinates: { [key: string]: { lat: number; lng: number; fullName: string } } = {
    'kanpur': { lat: 26.43640985331962, lng: 80.31590396508177, fullName: 'Kanpur, Uttar Pradesh, India' },
    'delhi': { lat: 28.6139, lng: 77.2090, fullName: 'Delhi, Delhi, India' },
    'mumbai': { lat: 19.0760, lng: 72.8777, fullName: 'Mumbai, Maharashtra, India' },
    'bangalore': { lat: 12.9716, lng: 77.5946, fullName: 'Bangalore, Karnataka, India' },
    'chennai': { lat: 13.0827, lng: 80.2707, fullName: 'Chennai, Tamil Nadu, India' },
    'kolkata': { lat: 22.5726, lng: 88.3639, fullName: 'Kolkata, West Bengal, India' },
    'hyderabad': { lat: 17.3850, lng: 78.4867, fullName: 'Hyderabad, Telangana, India' },
    'pune': { lat: 18.5204, lng: 73.8567, fullName: 'Pune, Maharashtra, India' },
    'goa': { lat: 15.2993, lng: 74.1240, fullName: 'Goa, India' },
    'bali': { lat: -8.3405, lng: 115.0920, fullName: 'Bali, Indonesia' },
    'jakarta': { lat: -6.2088, lng: 106.8456, fullName: 'Jakarta, Indonesia' },
    'uluwatu': { lat: -8.8290, lng: 115.0844, fullName: 'Uluwatu, Bali, Indonesia' },
  };

  const normalizedCity = cityName.toLowerCase().trim();
  const cityData = cityCoordinates[normalizedCity];

  if (cityData) {
    return {
      description: cityData.fullName,
      placeId: `mock_${normalizedCity}_search`,
      latitude: cityData.lat,
      longitude: cityData.lng,
    };
  }

  return null;
};

export default function Search() {
  const insets = useSafeAreaInsets();

  // State management
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Hotel[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Location search state
  const [selectedLocation, setSelectedLocation] = useState<{
    description: string;
    placeId: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [nearbyHotels, setNearbyHotels] = useState<Hotel[]>([]);
  const [searchingNearby, setSearchingNearby] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      try {
        const historyData = await getSearchHistory();
        setSearchHistory(historyData);
      } catch (error) {
        setSearchHistory(['Bali', 'Goa', 'Mumbai']);
      }

      try {
        const recommendationsData = await getRecommendedHotels(10);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error(error);
      }

      try {
        const recentData = await getRecentlyViewed();
        setRecentlyViewed(recentData);
      } catch (error) {
        setRecentlyViewed([]);
      }

      try {
        const favoritesData = await getFavorites();
        setFavorites(favoritesData);
      } catch (error) {
        setFavorites([]);
      }

    } catch (error) {
      console.error('Error loading search data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);



  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      if (selectedLocation) {
        handleClearLocation();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedLocation]);

  // Handle favorite toggle
  const handleToggleFavorite = async (hotelId: string) => {
    try {
      const newFavoriteStatus = await toggleFavoriteService(hotelId);
      if (newFavoriteStatus) {
        setFavorites(prev => [...prev, hotelId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== hotelId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle search tag selection
  const handleSearchTagPress = async (searchTerm: string) => {
    try {
      await addToSearchHistory(searchTerm);
      const mockLocation = createMockLocationFromSearchTerm(searchTerm);
      if (mockLocation) {
        await handleLocationSelect(mockLocation);
      } else {
        // Just simple search handling placeholder
      }
    } catch (error) {
      console.error('Error handling search tag press:', error);
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location: any) => {
    try {
      console.log('Search screen - Location selected:', location);

      // Save location to shared storage
      try {
        const { saveSelectedLocation } = await import('../../services/locationStorage');
        await saveSelectedLocation(location);
      } catch (error) {
        console.error('Error saving location:', error);
      }

      await addToSearchHistory(location.description);
      setSelectedLocation(location);

      if (location.latitude && location.longitude) {
        setSearchingNearby(true);
        const nearby = await searchHotelsByLocation(location.latitude, location.longitude, 50);
        setNearbyHotels(nearby);
        setSearchingNearby(false);
      } else {
        setSearchingNearby(false);
      }
    } catch (error) {
      console.error('Error handling location selection:', error);
      setSearchingNearby(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (query: string) => {
    if (!query.trim() && selectedLocation) {
      handleClearLocation();
    }
  };

  // Handle clearing location search
  const handleClearLocation = async () => {
    try {
      // Clear from storage
      const { clearSelectedLocation } = await import('../../services/locationStorage');
      await clearSelectedLocation();
    } catch (error) {
      console.error('Error clearing stored location:', error);
    }

    setSelectedLocation(null);
    setNearbyHotels([]);
    setSearchingNearby(false);
  };

  // Load selected location from storage when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadSelectedLocation = async () => {
        try {
          const { getSelectedLocation, isLocationRecent } = await import('../../services/locationStorage');
          const storedLocation = await getSelectedLocation();

          if (storedLocation && isLocationRecent(storedLocation)) {
            console.log('Loading stored location on focus:', storedLocation);
            // Check if this is a different location than currently selected
            if (!selectedLocation || selectedLocation.placeId !== storedLocation.placeId) {
              await handleLocationSelect(storedLocation);
            }
          }
        } catch (error) {
          console.error('Error loading selected location:', error);
        }
      };

      loadSelectedLocation();
    }, [selectedLocation])
  );

  // Handle back button press
  const handleBackPress = () => {
    if (selectedLocation) {
      handleClearLocation();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)/home');
      }
    }
  };

  // Handle hotel card press
  const handleHotelPress = async (hotel: Hotel) => {
    await addToRecentlyViewed(hotel);
    router.push(`/hotel/${hotel.id}`);
  };

  const renderSearchTag = (search: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.searchTag}
      activeOpacity={0.7}
      onPress={() => handleSearchTagPress(search)}
    >
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: index * 50 } as any}
      >
        <Text style={styles.searchTagText}>{search}</Text>
      </MotiView>
    </TouchableOpacity>
  );

  const renderRecommendationCard = ({ item }: { item: Hotel }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 } as any}
    >
      <TouchableOpacity
        style={styles.recommendationCard}
        activeOpacity={0.9}
        onPress={() => handleHotelPress(item)}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10, 14, 39, 0.8)', '#0a0e27']}
          style={styles.cardGradient}
        />

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item.id)}
        >
          <Heart
            size={20}
            color={favorites.includes(item.id) ? '#EF4444' : '#FFF'}
            fill={favorites.includes(item.id) ? '#EF4444' : 'transparent'}
          />
        </TouchableOpacity>

        <View style={styles.cardContentOverlay}>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{getSafeNumber(item.rating, 4.5).toFixed(1)}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#00D9FF" />
            <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>₹{getSafeNumber(item.price)}</Text>
            <Text style={styles.priceUnit}>/night</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  const renderRecentlyViewedItem = ({ item }: { item: RecentlyViewedItem }) => (
    <TouchableOpacity
      style={styles.recentItem}
      activeOpacity={0.8}
      onPress={() => handleHotelPress({ ...item, id: item.id } as any)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.recentImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.recentContent}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle} numberOfLines={1}>{item.hotelName}</Text>
          <View style={styles.recentRating}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.recentRatingText}>{getSafeNumber(item.rating, 4.5).toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.recentLocationRow}>
          <MapPin size={12} color="#00D9FF" />
          <Text style={styles.recentLocation} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={styles.recentFooter}>
          <View style={styles.recentAmenities}>
            {['Wifi', 'AC'].map((amenity, idx) => (
              <View key={idx} style={styles.amenityChip}>
                <Text style={styles.amenityChipText}>{amenity}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.recentPrice}>
            <Text style={styles.recentPriceAmount}>₹{getSafeNumber(item.price)}</Text>
            <Text style={styles.recentPriceUnit}>/night</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.flex1}>
          <InlineLocationSearch
            onLocationSelect={handleLocationSelect}
            onSearchChange={handleSearchChange}
            onClear={handleClearLocation}
            googleMapsApiKey="AIzaSyCayIVJJi7Q-kncORA2HSavMdPIIHB35Z0"
            placeholder="Search hotel or location"
          />
        </View>
      </View>

      {/* Main Content */}
      {selectedLocation ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Stays in {selectedLocation.description.split(',')[0]}</Text>
            <Text style={styles.resultsSubtitle}>{nearbyHotels.length} places found</Text>
          </View>

          {searchingNearby ? (
            <ActivityIndicator color="#00D9FF" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={nearbyHotels}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultCard} activeOpacity={0.9} onPress={() => handleHotelPress(item)}>
                  <Image source={{ uri: item.image }} style={styles.resultImage} contentFit="cover" transition={300} />
                  <View style={styles.resultContent}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                      {getSafeNumber(item.rating) > 0 && (
                        <View style={styles.ratingBadgeSM}>
                          <Star size={10} color="#FBBF24" fill="#FBBF24" />
                          <Text style={styles.ratingTextSM}>{getSafeNumber(item.rating).toFixed(1)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.addressRow}>
                      <MapPin size={12} color="#9CA3AF" />
                      <Text style={styles.resultLocation} numberOfLines={1}>{item.address || item.location}</Text>
                    </View>

                    {item.amenities && item.amenities.length > 0 && (
                      <View style={styles.amenitiesRow}>
                        {item.amenities.slice(0, 3).map((amenity, index) => (
                          <View key={index} style={styles.amenityBadge}>
                            <Text style={styles.amenityText} numberOfLines={1}>
                              {amenity.replace(/-/g, ' ')}
                            </Text>
                          </View>
                        ))}
                        {item.amenities.length > 3 && (
                          <Text style={styles.moreAmenities}>+{item.amenities.length - 3}</Text>
                        )}
                      </View>
                    )}

                    {/* Availability Badges */}
                    <View style={styles.availabilityRow}>
                      {item.hasHourly && (
                        <View style={styles.hourlyBadge}>
                          <Clock size={10} color="#E0F2FE" />
                          <Text style={styles.hourlyText}>Hourly</Text>
                        </View>
                      )}
                      {item.hasNightly && (
                        <View style={styles.nightlyBadge}>
                          <Moon size={10} color="#E0E7FF" />
                          <Text style={styles.nightlyText}>Nightly</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceFooter}>
                      <View style={styles.priceInfo}>
                        <Text style={styles.fromText}>Starts from</Text>
                        <Text style={styles.resultPrice}>₹{item.price}<Text style={styles.resultPriceUnit}>/night</Text></Text>
                      </View>
                      <View style={styles.viewBtn}>
                        <Text style={styles.viewBtnText}>View</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, gap: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9FF" />
          }
        >
          {/* Latest Search */}
          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Latest Search</Text>
              <View style={styles.tagsWrapper}>
                {searchHistory.map(renderSearchTag)}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={recommendations}
                renderItem={renderRecommendationCard}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                snapToInterval={Math.min(width * 0.75, 320) + 16}
                decelerationRate="fast"
              />
            </View>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginBottom: 12 }]}>Recently Viewed</Text>
              <View style={{ paddingHorizontal: 20, gap: 16 }}>
                {recentlyViewed.map(item => (
                  <View key={item.id}>
                    {renderRecentlyViewedItem({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {!searchHistory.length && !recommendations.length && !recentlyViewed.length && (
            <View style={styles.emptyState}>
              <SearchIcon size={50} color="rgba(255, 255, 255, 0.2)" />
              <Text style={styles.emptyTitle}>Start Exploring</Text>
              <Text style={styles.emptySubtitle}>Search for destinations, hotels, and more.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27', // Dark Navy
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    marginTop: 10,
  },
  backIcon: {
    padding: 4,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 14,
    color: '#00D9FF',
    fontWeight: '600',
  },

  // Tags
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  searchTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchTagText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 13,
  },

  // Recommendation Card
  recommendationCard: {
    width: width * 0.75,
    maxWidth: 320,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  cardContentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardLocation: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    color: '#FFFFFF', // White
    fontSize: 20,
    fontWeight: '700',
  },
  priceUnit: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },

  // Recently Viewed
  recentItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  recentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recentRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  recentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  recentLocation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  recentAmenities: {
    flexDirection: 'row',
    gap: 4,
  },
  amenityChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amenityChipText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  recentPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  recentPriceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
  },
  recentPriceUnit: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Empty State
  emptyState: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Search Results
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultImage: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultContent: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  ratingBadgeSM: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingTextSM: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resultLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  amenityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  moreAmenities: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'center',
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  hourlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hourlyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8', // Sky 400
  },
  nightlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nightlyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8', // Indigo 400
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    justifyContent: 'center',
  },
  fromText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  resultPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  resultPriceUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  viewBtn: {
    backgroundColor: '#00D9FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewBtnText: {
    color: '#0a0e27',
    fontWeight: '700',
    fontSize: 14,
  },
});