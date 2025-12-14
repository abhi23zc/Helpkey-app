import React, { useState, useEffect, useCallback } from 'react';
import { 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Heart, Clock, Wifi, Car, X, Search as SearchIcon } from 'lucide-react-native';
import { router } from 'expo-router';
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

// Responsive breakpoints
const isTablet = width >= 768;
const isLargeScreen = width >= 1024;

// Responsive dimensions
const getResponsiveDimensions = () => {
  const cardWidth = isLargeScreen ? width * 0.4 : isTablet ? width * 0.5 : width * 0.7;
  const cardHeight = isTablet ? 220 : 180;
  const horizontalPadding = isTablet ? 32 : 20;
  const sectionSpacing = isTablet ? 32 : 24;
  
  return {
    cardWidth,
    cardHeight,
    horizontalPadding,
    sectionSpacing,
    fontSize: {
      title: isTablet ? 24 : 20,
      subtitle: isTablet ? 18 : 16,
      body: isTablet ? 16 : 14,
      caption: isTablet ? 14 : 12,
    }
  };
};

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
    'kanpur': { lat: 26.4499, lng: 80.3319, fullName: 'Kanpur, Uttar Pradesh, India' },
    'maksooda bad': { lat: 26.4499, lng: 80.3319, fullName: 'Maksooda Bad, Uttar Pradesh, India' },
    'maksooda': { lat: 26.4499, lng: 80.3319, fullName: 'Maksooda Bad, Uttar Pradesh, India' },
    'delhi': { lat: 28.6139, lng: 77.2090, fullName: 'Delhi, Delhi, India' },
    'mumbai': { lat: 19.0760, lng: 72.8777, fullName: 'Mumbai, Maharashtra, India' },
    'bangalore': { lat: 12.9716, lng: 77.5946, fullName: 'Bangalore, Karnataka, India' },
    'chennai': { lat: 13.0827, lng: 80.2707, fullName: 'Chennai, Tamil Nadu, India' },
    'kolkata': { lat: 22.5726, lng: 88.3639, fullName: 'Kolkata, West Bengal, India' },
    'hyderabad': { lat: 17.3850, lng: 78.4867, fullName: 'Hyderabad, Telangana, India' },
    'pune': { lat: 18.5204, lng: 73.8567, fullName: 'Pune, Maharashtra, India' },
    'ahmedabad': { lat: 23.0225, lng: 72.5714, fullName: 'Ahmedabad, Gujarat, India' },
    'jaipur': { lat: 26.9124, lng: 75.7873, fullName: 'Jaipur, Rajasthan, India' },
    'lucknow': { lat: 26.8467, lng: 80.9462, fullName: 'Lucknow, Uttar Pradesh, India' },
    'agra': { lat: 27.1767, lng: 78.0081, fullName: 'Agra, Uttar Pradesh, India' },
    'varanasi': { lat: 25.3176, lng: 82.9739, fullName: 'Varanasi, Uttar Pradesh, India' },
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
  const dimensions = getResponsiveDimensions();
  
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
      console.log('Loading search data...');
      
      // Load data sequentially to better handle errors
      try {
        const historyData = await getSearchHistory();
        console.log('Search history loaded:', historyData.length);
        setSearchHistory(historyData);
      } catch (error) {
        console.error('Error loading search history:', error);
        setSearchHistory(['Bali', 'Jakarta', 'Uluwatu']); // Fallback data
      }
      
      try {
        const recommendationsData = await getRecommendedHotels(10);
        console.log('Recommendations loaded:', recommendationsData.length);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        // Fallback will be handled in the service
      }
      
      try {
        const recentData = await getRecentlyViewed();
        console.log('Recent data loaded:', recentData.length);
        setRecentlyViewed(recentData);
      } catch (error) {
        console.error('Error loading recent data:', error);
        setRecentlyViewed([]);
      }
      
      try {
        const favoritesData = await getFavorites();
        console.log('Favorites loaded:', favoritesData.length);
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
      
      console.log('All data loaded successfully');
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
      handleBackPress();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [selectedLocation]); // Re-run when selectedLocation changes

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
      // Don't show alert for now, just log the error
    }
  };

  // Handle search tag selection
  const handleSearchTagPress = async (searchTerm: string) => {
    try {
      console.log('Search tag pressed:', searchTerm);
      await addToSearchHistory(searchTerm);
      
      // Check if the search term looks like a location (contains comma or "India")
      if (searchTerm.includes(',') || searchTerm.toLowerCase().includes('india')) {
        // Try to parse location from search term
        const locationParts = searchTerm.split(',');
        const cityName = locationParts[0].trim();
        
        // Create a mock location object for common cities
        const mockLocation = createMockLocationFromSearchTerm(cityName);
        
        if (mockLocation) {
          // Trigger location search directly
          await handleLocationSelect(mockLocation);
        } else {
          // Fallback: just show the search term in the search bar
          console.log('Could not parse location, showing as search term');
        }
      } else {
        // For non-location searches, you could implement hotel name search here
        console.log('Non-location search term:', searchTerm);
      }
    } catch (error) {
      console.error('Error handling search tag press:', error);
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location: any) => {
    try {
      console.log('Selected location:', location);
      await addToSearchHistory(location.description);
      
      // Set selected location and search for nearby hotels
      setSelectedLocation(location);
      
      if (location.latitude && location.longitude) {
        console.log(`Searching for hotels near ${location.description} (${location.latitude}, ${location.longitude})`);
        setSearchingNearby(true);
        const nearby = await searchHotelsByLocation(location.latitude, location.longitude, 50);
        console.log(`Found ${nearby.length} nearby hotels`);
        setNearbyHotels(nearby);
        setSearchingNearby(false);
      } else {
        console.log('No coordinates provided for location');
        setSearchingNearby(false);
      }
    } catch (error) {
      console.error('Error handling location selection:', error);
      setSearchingNearby(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (query: string) => {
    // If query is empty and we have a selected location, clear it
    if (!query.trim() && selectedLocation) {
      handleClearLocation();
    }
    console.log('Search query changed:', query);
  };

  // Handle clearing location search
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setNearbyHotels([]);
    setSearchingNearby(false);
  };

  // Handle back button press
  const handleBackPress = () => {
    if (selectedLocation) {
      // If we're showing search results, go back to the main search view
      handleClearLocation();
    } else {
      // Otherwise, navigate back to the previous screen
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to home if no previous screen
        router.push('/(tabs)/home');
      }
    }
  };

  // Handle hotel card press
  const handleHotelPress = async (hotel: Hotel) => {
    try {
      await addToRecentlyViewed(hotel);
      // Navigate to hotel details
      router.push(`/hotel/${hotel.id}`);
    } catch (error) {
      console.error('Error handling hotel press:', error);
    }
  };

  // Render functions
  const renderSearchTag = (search: string, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.searchTag, { paddingHorizontal: dimensions.horizontalPadding * 0.8 }]} 
      activeOpacity={0.6}
      onPress={() => {
        console.log('Search tag clicked:', search);
        handleSearchTagPress(search);
      }}
    >
      <Text style={[styles.searchTagText, { fontSize: dimensions.fontSize.body }]}>{search}</Text>
    </TouchableOpacity>
  );

  const renderRecommendationCard = ({ item }: { item: Hotel }) => (
    <TouchableOpacity 
      style={[styles.recommendationCard, { 
        width: dimensions.cardWidth,
        marginRight: isTablet ? 20 : 16 
      }]}
      activeOpacity={0.9}
      onPress={() => handleHotelPress(item)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={[styles.cardImage, { height: dimensions.cardHeight }]} 
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item.id)}
          activeOpacity={0.7}
        >
          <Heart 
            size={isTablet ? 24 : 20} 
            color={favorites.includes(item.id) ? '#FF6B6B' : '#fff'} 
            fill={favorites.includes(item.id) ? '#FF6B6B' : 'transparent'}
          />
        </TouchableOpacity>
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingBadgeText}>{getSafeNumber(item.rating, 4.0).toFixed(1)}</Text>
        </View>
      </View>
      
      <View style={[styles.cardContent, { padding: isTablet ? 20 : 16 }]}>
        <Text style={[styles.cardTitle, { fontSize: dimensions.fontSize.subtitle }]} numberOfLines={1}>
          {item.name}
        </Text>
        
        <View style={styles.locationRow}>
          <MapPin size={isTablet ? 14 : 12} color="#999" />
          <Text style={[styles.cardLocation, { fontSize: dimensions.fontSize.body }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        {/* Amenities Row */}
        <View style={styles.amenitiesRow}>
          {item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              {amenity.toLowerCase().includes('wifi') ? <Wifi size={10} color="#00BCD4" /> : null}
              {amenity.toLowerCase().includes('parking') ? <Car size={10} color="#00BCD4" /> : null}
              {!amenity.toLowerCase().includes('wifi') && !amenity.toLowerCase().includes('parking') ? (
                <Text style={styles.amenityDot}>•</Text>
              ) : null}
              <Text style={styles.amenityText} numberOfLines={1}>
                {amenity.length > 8 ? amenity.substring(0, 8) + '...' : amenity}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.priceRatingRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>
              <Text style={[styles.priceAmount, { fontSize: isTablet ? 20 : 18 }]}>
                ₹{getSafeNumber(item.price)}
              </Text>
              <Text style={[styles.priceUnit, { fontSize: dimensions.fontSize.body }]}>
                /night
              </Text>
            </Text>
            {getSafeNumber(item.originalPrice) > getSafeNumber(item.price) ? (
              <Text style={styles.originalPrice}>₹{getSafeNumber(item.originalPrice)}</Text>
            ) : null}
          </View>
          
          <View style={styles.reviewsContainer}>
            <Text style={[styles.reviewsText, { fontSize: dimensions.fontSize.caption }]}>
              ({getSafeNumber(item.reviewCount) || getSafeNumber(item.reviews)} reviews)
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render vertical hotel list item for search results
  const renderVerticalHotelItem = ({ item }: { item: Hotel }) => (
    <TouchableOpacity 
      style={styles.verticalHotelItem}
      activeOpacity={0.9}
      onPress={() => handleHotelPress(item)}
    >
      <View style={styles.verticalImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.verticalHotelImage} 
          resizeMode="cover"
        />
        
        {/* Overlay Content */}
        <View style={styles.imageOverlay}>
          {/* Top Row - Rating and Favorite */}
          <View style={styles.imageTopRow}>
            <View style={styles.verticalRatingBadge}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={styles.verticalRatingText}>{getSafeNumber(item.rating, 4.0).toFixed(1)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.verticalFavoriteButton}
              onPress={() => handleToggleFavorite(item.id)}
              activeOpacity={0.7}
            >
              <Heart 
                size={20} 
                color={favorites.includes(item.id) ? '#FF6B6B' : '#fff'} 
                fill={favorites.includes(item.id) ? '#FF6B6B' : 'transparent'}
              />
            </TouchableOpacity>
          </View>
          
          {/* Bottom Row - Distance */}
          {item.distance ? (
            <View style={styles.imageBottomRow}>
              <View style={styles.distanceBadge}>
                <MapPin size={10} color="#fff" />
                <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
      
      <View style={styles.verticalHotelContent}>
        <View style={styles.verticalHotelHeader}>
          <View style={styles.hotelTitleContainer}>
            <Text style={styles.verticalHotelTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.verticalLocationRow}>
              <MapPin size={12} color="#999" />
              <Text style={styles.verticalLocation} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>
          
          <View style={styles.verticalPriceContainer}>
            <Text style={styles.verticalPrice}>
              <Text style={styles.verticalPriceAmount}>₹{getSafeNumber(item.price)}</Text>
              <Text style={styles.verticalPriceUnit}>/night</Text>
            </Text>
            {getSafeNumber(item.originalPrice) > getSafeNumber(item.price) ? (
              <Text style={styles.verticalOriginalPrice}>₹{getSafeNumber(item.originalPrice)}</Text>
            ) : null}
          </View>
        </View>
        
        {/* Booking Types and Amenities */}
        <View style={styles.infoRow}>
          {/* Booking Type Badges */}
          <View style={styles.bookingTypesContainer}>
            {(item as any).hasNightly ? (
              <View style={styles.bookingTypeBadge}>
                <Clock size={10} color="#00BCD4" />
                <Text style={styles.bookingTypeText}>Nightly</Text>
              </View>
            ) : null}
            {(item as any).hasHourly ? (
              <View style={styles.bookingTypeBadge}>
                <Clock size={10} color="#FF6B35" />
                <Text style={[styles.bookingTypeText, { color: '#FF6B35' }]}>Hourly</Text>
              </View>
            ) : null}
          </View>
          
          {/* Top Amenities */}
          <View style={styles.verticalAmenitiesRow}>
            {item.amenities.slice(0, 2).map((amenity, index) => (
              <View key={index} style={styles.verticalAmenityTag}>
                {amenity.toLowerCase().includes('wifi') ? <Wifi size={8} color="#00BCD4" /> : null}
                {amenity.toLowerCase().includes('parking') ? <Car size={8} color="#00BCD4" /> : null}
                {!amenity.toLowerCase().includes('wifi') && !amenity.toLowerCase().includes('parking') ? (
                  <Text style={styles.amenityDot}>•</Text>
                ) : null}
                <Text style={styles.verticalAmenityText} numberOfLines={1}>
                  {amenity.length > 8 ? amenity.substring(0, 8) + '...' : amenity}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.verticalBottomRow}>
          <View style={styles.distanceInfoContainer}>
            {item.distance ? (
              <Text style={styles.distanceInfoText}>
                {item.distance.toFixed(1)} km from your location
              </Text>
            ) : (
              <Text style={styles.distanceInfoText}>
                {getSafeNumber(item.reviewCount) || getSafeNumber(item.reviews)} reviews
              </Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.bookNowButton} activeOpacity={0.8}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentlyViewedItem = ({ item }: { item: RecentlyViewedItem }) => (
    <TouchableOpacity 
      style={[styles.recentItem, { 
        marginHorizontal: dimensions.horizontalPadding,
        marginBottom: isTablet ? 20 : 16 
      }]} 
      activeOpacity={0.7}
      onPress={() => console.log('Navigate to hotel:', item.hotelName)}
    >
      <View style={styles.recentImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={[styles.recentImage, { 
            width: isTablet ? 100 : 80, 
            height: isTablet ? 100 : 80 
          }]} 
          resizeMode="cover"
        />
        <View style={styles.recentRatingBadge}>
          <Star size={10} color="#FFD700" fill="#FFD700" />
          <Text style={styles.recentRatingText}>{getSafeNumber(item.rating, 4.0).toFixed(1)}</Text>
        </View>
      </View>
      
      <View style={[styles.recentContent, { padding: isTablet ? 16 : 12 }]}>
        <Text style={[styles.recentTitle, { fontSize: dimensions.fontSize.subtitle }]} numberOfLines={1}>
          {item.hotelName}
        </Text>
        
        <View style={styles.locationRow}>
          <MapPin size={isTablet ? 14 : 12} color="#999" />
          <Text style={[styles.recentLocation, { fontSize: dimensions.fontSize.caption }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        <View style={styles.recentTimeRow}>
          <Clock size={12} color="#999" />
          <Text style={styles.recentTimeText}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.recentPriceRow}>
          <Text style={styles.recentPrice}>
            <Text style={[styles.priceAmount, { fontSize: isTablet ? 18 : 16 }]}>
              ₹{getSafeNumber(item.price)}
            </Text>
            <Text style={[styles.priceUnit, { fontSize: dimensions.fontSize.caption }]}>
              /night
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BCD4" />
          <Text style={[styles.loadingText, { fontSize: dimensions.fontSize.body }]}>
            Loading search data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Integrated Search */}
      <View style={[styles.header, { paddingHorizontal: dimensions.horizontalPadding }]}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            selectedLocation && styles.backButtonActive
          ]} 
          activeOpacity={0.7}
          onPress={handleBackPress}
        >
          <ArrowLeft 
            size={isTablet ? 28 : 24} 
            color={selectedLocation ? "#00BCD4" : "#333"} 
          />
        </TouchableOpacity>
        
        <View style={styles.searchBarContainer}>
          <InlineLocationSearch
            onLocationSelect={handleLocationSelect}
            onSearchChange={handleSearchChange}
            onClear={handleClearLocation}
            googleMapsApiKey="AIzaSyCayIVJJi7Q-kncORA2HSavMdPIIHB35Z0" 
            placeholder="Search hotel or location"
          />
        </View>
      </View>

      {/* Content Area */}
      {selectedLocation ? (
        // Location Search Results View
        <View style={styles.searchResultsContainer}>
          {/* Location Header */}
          <View style={styles.locationHeader}>
            <View style={styles.locationInfo}>
              <MapPin size={20} color="#00BCD4" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {selectedLocation.description}
                </Text>
                <Text style={styles.locationSubtitle}>
                  {nearbyHotels.length} hotels found
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.clearLocationButton}
              onPress={handleClearLocation}
              activeOpacity={0.7}
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Hotels List */}
          {searchingNearby ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#00BCD4" />
              <Text style={styles.searchingText}>Finding nearby hotels...</Text>
            </View>
          ) : (
            <FlatList
              data={nearbyHotels}
              renderItem={renderVerticalHotelItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.verticalHotelsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#00BCD4']}
                  tintColor="#00BCD4"
                />
              }
              ListEmptyComponent={
                <View style={styles.noHotelsContainer}>
                  <MapPin size={64} color="#E0E0E0" />
                  <Text style={styles.noHotelsTitle}>No hotels found</Text>
                  <Text style={styles.noHotelsSubtitle}>
                    Try searching for a different location or expand your search radius
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        // Default Home View
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === 'ios' ? 120 : 100,
            minHeight: height - insets.top - 100
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00BCD4']}
              tintColor="#00BCD4"
            />
          }
        >
        {/* Latest Search Section */}
        {searchHistory.length > 0 && (
          <View style={[styles.section, { 
            marginTop: dimensions.sectionSpacing,
            paddingHorizontal: dimensions.horizontalPadding 
          }]}>
            <Text style={[styles.sectionTitle, { fontSize: dimensions.fontSize.title }]}>
              Latest Search
            </Text>
            <View style={styles.searchTagsContainer}>
              {searchHistory.map(renderSearchTag)}
            </View>
          </View>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <View style={[styles.section, { marginTop: dimensions.sectionSpacing }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: dimensions.horizontalPadding }]}>
              <Text style={[styles.sectionTitle, { fontSize: dimensions.fontSize.title }]}>
                Recommendations
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { fontSize: dimensions.fontSize.subtitle }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recommendations}
              renderItem={renderRecommendationCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.recommendationsContainer, { 
                paddingLeft: dimensions.horizontalPadding 
              }]}
              snapToInterval={dimensions.cardWidth + (isTablet ? 20 : 16)}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <View style={[styles.section, { marginTop: dimensions.sectionSpacing }]}>
            <Text style={[styles.sectionTitle, { 
              fontSize: dimensions.fontSize.title,
              paddingHorizontal: dimensions.horizontalPadding 
            }]}>
              Recently Viewed
            </Text>
            <FlatList
              data={recentlyViewed}
              renderItem={renderRecentlyViewedItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Empty State */}
        {searchHistory.length === 0 && recommendations.length === 0 && recentlyViewed.length === 0 && (
          <View style={styles.emptyContainer}>
            <SearchIcon size={isTablet ? 80 : 64} color="#E0E0E0" />
            <Text style={[styles.emptyTitle, { fontSize: dimensions.fontSize.title }]}>
              Start Exploring
            </Text>
            <Text style={[styles.emptySubtitle, { fontSize: dimensions.fontSize.body }]}>
              Search for hotels and destinations to see personalized recommendations
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => {
                // Focus on the search input to start searching
                console.log('Start searching button pressed');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.exploreButtonText, { fontSize: dimensions.fontSize.subtitle }]}>
                Start Searching
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: isTablet ? 16 : 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: isTablet ? 16 : 12,
  },
  backButton: {
    padding: isTablet ? 12 : 8,
    marginLeft: isTablet ? -12 : -8,
    marginTop: isTablet ? 8 : 4,
    borderRadius: isTablet ? 12 : 8,
  },
  backButtonActive: {
    backgroundColor: '#E8F8F5',
  },
  searchBarContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: isTablet ? 8 : 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#333',
    marginBottom: isTablet ? 20 : 16,
  },
  seeAllText: {
    color: '#00BCD4',
    fontWeight: '600',
  },
  searchTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isTablet ? 16 : 12,
  },
  searchTag: {
    backgroundColor: '#E6F7FF',
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 25 : 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
    shadowColor: '#00BCD4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchTagText: {
    color: '#00BCD4',
    fontWeight: '500',
  },
  recommendationsContainer: {
    paddingRight: isTablet ? 32 : 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: isTablet ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isTablet ? 4 : 2,
    },
    shadowOpacity: isTablet ? 0.15 : 0.1,
    shadowRadius: isTablet ? 12 : 8,
    elevation: isTablet ? 6 : 4,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    borderTopLeftRadius: isTablet ? 20 : 16,
    borderTopRightRadius: isTablet ? 20 : 16,
    backgroundColor: '#f5f5f5',
  },
  favoriteButton: {
    position: 'absolute',
    top: isTablet ? 16 : 12,
    right: isTablet ? 16 : 12,
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: isTablet ? 16 : 12,
    left: isTablet ? 16 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    // Dynamic padding applied in component
  },
  cardTitle: {
    fontWeight: '700',
    color: '#333',
    marginBottom: isTablet ? 8 : 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 6 : 4,
    marginBottom: isTablet ? 16 : 12,
  },
  cardLocation: {
    color: '#999',
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  amenityDot: {
    fontSize: 8,
    color: '#00BCD4',
  },
  amenityText: {
    fontSize: 10,
    color: '#00BCD4',
    fontWeight: '500',
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  cardPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontWeight: '700',
    color: '#00BCD4',
  },
  priceUnit: {
    color: '#999',
    fontWeight: '400',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  reviewsContainer: {
    alignItems: 'flex-end',
  },
  reviewsText: {
    color: '#666',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 6 : 4,
  },
  ratingText: {
    fontWeight: '600',
    color: '#333',
  },
  recentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: isTablet ? 16 : 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isTablet ? 2 : 1,
    },
    shadowOpacity: isTablet ? 0.08 : 0.05,
    shadowRadius: isTablet ? 6 : 4,
    elevation: isTablet ? 3 : 2,
    overflow: 'hidden',
  },
  recentImageContainer: {
    position: 'relative',
  },
  recentImage: {
    backgroundColor: '#f5f5f5',
    borderRadius: isTablet ? 12 : 8,
  },
  recentRatingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  recentRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  recentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  recentTimeText: {
    fontSize: 11,
    color: '#999',
  },
  recentContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recentTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: isTablet ? 6 : 4,
  },
  recentLocation: {
    color: '#999',
    flex: 1,
  },
  recentPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isTablet ? 12 : 8,
  },
  recentPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 64 : 32,
    paddingVertical: isTablet ? 80 : 60,
    minHeight: height * 0.5,
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#333',
    marginTop: isTablet ? 24 : 16,
    marginBottom: isTablet ? 16 : 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 22,
    marginBottom: isTablet ? 32 : 24,
  },
  exploreButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 16 : 12,
    borderRadius: isTablet ? 30 : 25,
    shadowColor: '#00BCD4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Location Search Results Styles
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: isTablet ? 20 : 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
  },
  clearLocationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  searchingText: {
    fontSize: isTablet ? 18 : 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Vertical Hotel List Styles
  verticalHotelsList: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 16 : 12,
  },
  verticalHotelItem: {
    backgroundColor: '#fff',
    borderRadius: isTablet ? 20 : 16,
    marginBottom: isTablet ? 24 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  verticalImageContainer: {
    position: 'relative',
    width: '100%',
    height: isTablet ? 220 : 180,
  },
  verticalHotelImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: isTablet ? 16 : 12,
  },
  imageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  verticalFavoriteButton: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  verticalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 14 : 12,
    gap: 4,
  },
  verticalRatingText: {
    color: '#fff',
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BCD4',
    paddingHorizontal: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 14 : 12,
    gap: 4,
  },
  distanceText: {
    color: '#fff',
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
  },
  verticalHotelContent: {
    padding: isTablet ? 20 : 16,
  },
  verticalHotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isTablet ? 12 : 10,
  },
  hotelTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  verticalHotelTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    lineHeight: isTablet ? 26 : 24,
  },
  verticalPriceContainer: {
    alignItems: 'flex-end',
  },
  verticalPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  verticalPriceAmount: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '800',
    color: '#00BCD4',
  },
  verticalPriceUnit: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
    fontWeight: '500',
  },
  verticalOriginalPrice: {
    fontSize: isTablet ? 14 : 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  verticalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verticalLocation: {
    flex: 1,
    fontSize: isTablet ? 14 : 13,
    color: '#666',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 14,
  },
  bookingTypesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  bookingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 4 : 3,
    borderRadius: isTablet ? 8 : 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  bookingTypeText: {
    fontSize: isTablet ? 11 : 9,
    color: '#00BCD4',
    fontWeight: '600',
  },
  verticalAmenitiesRow: {
    flexDirection: 'row',
    gap: isTablet ? 8 : 6,
    flexWrap: 'wrap',
  },
  verticalAmenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 10 : 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  verticalAmenityText: {
    fontSize: isTablet ? 12 : 10,
    color: '#00BCD4',
    fontWeight: '600',
  },
  verticalBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceInfoContainer: {
    flex: 1,
  },
  distanceInfoText: {
    fontSize: isTablet ? 14 : 13,
    color: '#666',
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: isTablet ? 28 : 24,
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookNowText: {
    color: '#fff',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
  },
  
  // No Hotels Found Styles
  noHotelsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  noHotelsTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noHotelsSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});