import { SlidersHorizontal } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { fetchHotelsWithRooms } from '@/services/hotelService';
import {
  calculateDistance,
  getCurrentLocation,
  requestLocationPermission,
  UserLocation,
} from '@/services/locationService';
import { Hotel } from '@/types/hotel';

// Components
import DealCard from '@/components/home/DealCard';
import FiltersPanel from '@/components/home/FiltersPanel';
import GradientHeader from '@/components/home/GradientHeader';
import HotelCard from '@/components/home/HotelCard';
import { HorizontalHotelSkeleton } from '@/components/home/SkeletonLoader';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import MapView from '@/components/home/MapView';
import SectionHeader from '@/components/home/SectionHeader';
import LocationSearchInput from '@/components/home/LocationSearchInput';

const commonAmenities = [
  'Free WiFi',
  'Swimming Pool',
  'Parking',
  'Restaurant',
  'Gym',
  'Spa',
  'Air Conditioning',
];

const deals = [
  {
    id: '1',
    type: 'LONGSTAY',
    title: '55% off',
    subtitle: 'Longstay Hotels',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    dark: false,
  },
  {
    id: '2',
    type: 'PREPAID',
    title: 'Flat 25% off + extra 5% off',
    subtitle: 'On select hotels',
    image: 'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?w=400',
    dark: true,
  },
];

export default function Home() {
  const { user, userData } = useAuth();
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [maxPriceRange, setMaxPriceRange] = useState(5000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'rating' | 'distance'>(
    'recommended'
  );
  const [showFilters, setShowFilters] = useState(false);

  // Request location permission on mount
  useEffect(() => {
    const initLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          setLocationEnabled(true);
        }
      } else {
        // Show modal after 2 seconds if permission not granted
        setTimeout(() => {
          setShowLocationModal(true);
        }, 2000);
      }
    };

    initLocation();
  }, []);

  // Fetch hotels with rooms and caching
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        // Try to get hotels from cache first
        const { getHotelsFromCache, saveHotelsToCache } = await import('../../services/hotelCache');
        const cachedHotels = await getHotelsFromCache();

        if (cachedHotels && cachedHotels.length > 0) {
          console.log('Using cached hotels');
          // Use cached data immediately for better UX
          setAllHotels(cachedHotels);

          // Calculate distance for cached hotels if location is available
          if (userLocation) {
            const hotelsWithDistance = cachedHotels.map(hotel => {
              if (hotel.latitude && hotel.longitude) {
                return {
                  ...hotel,
                  distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    hotel.latitude,
                    hotel.longitude
                  )
                };
              }
              return hotel;
            });
            setAllHotels(hotelsWithDistance);
          }

          setLoading(false);
          setInitialLoad(false);
          return; // Use cache, don't fetch from network
        }

        // No cache or expired, fetch from network
        setLoading(true);
        console.log('Fetching hotels from network');
        const fetchedHotels = await fetchHotelsWithRooms();

        // Calculate distance if location is available
        if (userLocation && fetchedHotels.length > 0) {
          fetchedHotels.forEach((hotel) => {
            if (hotel.latitude && hotel.longitude) {
              hotel.distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                hotel.latitude,
                hotel.longitude
              );
            }
          });
        }

        if (fetchedHotels.length > 0) {
          const maxPrice = Math.max(...fetchedHotels.map((hotel) => hotel.price));
          const newMaxPrice = Math.ceil(maxPrice / 100) * 100;
          setMaxPriceRange(newMaxPrice);
          if (maxPrice > 2000) {
            setPriceRange([0, newMaxPrice]);
          }

          // Cache the fetched hotels
          await saveHotelsToCache(fetchedHotels);
        }

        setAllHotels(fetchedHotels);
        setLoading(false);
        setInitialLoad(false);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchHotels();
  }, [userLocation]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allHotels];

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (hotel) =>
          hotel.name?.toLowerCase().includes(queryLower) ||
          hotel.location?.toLowerCase().includes(queryLower) ||
          hotel.address?.toLowerCase().includes(queryLower) ||
          hotel.description?.toLowerCase().includes(queryLower) ||
          hotel.amenities.some(
            (amenity) =>
              typeof amenity === 'string' && amenity.toLowerCase().includes(queryLower)
          )
      );
    }

    filtered = filtered.filter(
      (hotel) => hotel.price >= priceRange[0] && hotel.price <= priceRange[1]
    );

    if (selectedStars.length > 0) {
      filtered = filtered.filter((hotel) => selectedStars.includes(hotel.stars));
    }

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((hotel) =>
        selectedAmenities.every((a) => hotel.amenities.includes(a))
      );
    }

    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter((hotel) => {
        const hotelInfo = (hotel.name + ' ' + (hotel.description || '')).toLowerCase();
        return selectedPropertyTypes.some((type) => hotelInfo.includes(type.toLowerCase()));
      });
    }

    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance' && userLocation) {
      // Sort by distance (nearest first)
      filtered = [...filtered].sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    }

    setHotels(filtered);
  }, [searchQuery, priceRange, selectedStars, selectedAmenities, selectedPropertyTypes, sortBy, allHotels, userLocation]);

  const handleStarFilter = (stars: number) => {
    setSelectedStars((prev) =>
      prev.includes(stars) ? prev.filter((s) => s !== stars) : [...prev, stars]
    );
  };

  const handleAmenityFilter = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePropertyTypeFilter = (type: string) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, maxPriceRange]);
    setSelectedStars([]);
    setSelectedAmenities([]);
    setSelectedPropertyTypes([]);
    setSortBy('recommended');
  };

  const handleRequestLocation = async () => {
    setShowLocationModal(false);
    const hasPermission = await requestLocationPermission();

    if (hasPermission) {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setLocationEnabled(true);
        Alert.alert('Success', 'Location enabled! Hotels will be sorted by distance.');
      } else {
        Alert.alert('Error', 'Could not get your location. Please try again.');
      }
    } else {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to show nearby hotels. You can enable it in settings.'
      );
    }
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const handleSearchPress = () => {
    setShowLocationModal(true);
  };

  const handleLocationSelect = async (location: {
    description: string;
    placeId: string;
    latitude?: number;
    longitude?: number;
  }) => {
    console.log('Location selected:', location);

    // Save location to shared storage
    try {
      const { saveSelectedLocation } = await import('../../services/locationStorage');
      await saveSelectedLocation(location);
    } catch (error) {
      console.error('Error saving location:', error);
    }

    // Update user location if coordinates are provided
    if (location.latitude && location.longitude) {
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.description.split(',')[0],
        region: location.description,
      });
      setLocationEnabled(true);
    }

    // Close the modal
    setShowLocationModal(false);

    // Stay on home screen - user can manually navigate to search if needed
  };

  const userName =
    userData?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Guest';
  const userPhoto = userData?.photoURL || user?.photoURL || undefined;
  const locationText = userLocation?.city || userLocation?.region || 'India';

  const hourlyHotels = hotels.filter((h) =>
    h.rooms.some((r) => r.bookingType === 'hourly' || r.bookingType === 'both')
  );

  const nightlyHotels = hotels.filter((h) =>
    h.rooms.some((r) => r.bookingType === 'nightly' || r.bookingType === 'both')
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Location Permission Modal */}
        <LocationPermissionModal
          visible={showLocationModal}
          onRequestPermission={handleRequestLocation}
          onClose={() => setShowLocationModal(false)}
        />

        {/* Gradient Header */}
        <GradientHeader
          userName={userName}
          userPhoto={userPhoto}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userLocation={locationText}
          onLocationPress={handleLocationPress}
          onSearchPress={handleSearchPress}
        />

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterToggle}
          >
            <SlidersHorizontal size={20} color="#0066FF" />
            <Text style={styles.filterToggleText}>Filters</Text>
          </TouchableOpacity>

          <View style={styles.priceRangeDisplay}>
            <Text style={styles.priceRangeLabel}>
              Price: ₹{priceRange[0].toLocaleString('en-IN')} - ₹
              {priceRange[1].toLocaleString('en-IN')}
            </Text>
          </View>

          <LocationSearchInput
            visible={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onLocationSelect={handleLocationSelect}
            googleMapsApiKey='AIzaSyCayIVJJi7Q-kncORA2HSavMdPIIHB35Z0'
          />

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterChips}
          >
            <TouchableOpacity
              style={[styles.chip, sortBy === 'recommended' && styles.chipActive]}
              onPress={() => setSortBy('recommended')}
            >
              <Text
                style={[styles.chipText, sortBy === 'recommended' && styles.chipTextActive]}
              >
                Recommended
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, sortBy === 'price-low' && styles.chipActive]}
              onPress={() => setSortBy('price-low')}
            >
              <Text style={[styles.chipText, sortBy === 'price-low' && styles.chipTextActive]}>
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, sortBy === 'price-high' && styles.chipActive]}
              onPress={() => setSortBy('price-high')}
            >
              <Text style={[styles.chipText, sortBy === 'price-high' && styles.chipTextActive]}>
                Price: High to Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, sortBy === 'rating' && styles.chipActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.chipText, sortBy === 'rating' && styles.chipTextActive]}>
                Top Rated
              </Text>
            </TouchableOpacity>
            {locationEnabled && (
              <TouchableOpacity
                style={[styles.chip, sortBy === 'distance' && styles.chipActive]}
                onPress={() => setSortBy('distance')}
              >
                <Text style={[styles.chipText, sortBy === 'distance' && styles.chipTextActive]}>
                  Nearby
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Filters Panel */}
        <FiltersPanel
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          priceRange={priceRange}
          maxPriceRange={maxPriceRange}
          onPriceRangeChange={setPriceRange}
          selectedStars={selectedStars}
          onStarToggle={handleStarFilter}
          selectedAmenities={selectedAmenities}
          onAmenityToggle={handleAmenityFilter}
          amenities={commonAmenities}
          onClearFilters={clearFilters}
          selectedPropertyTypes={selectedPropertyTypes}
          onPropertyTypeToggle={handlePropertyTypeFilter}
          onApply={() => setShowFilters(false)}
        />

        {/* Loading State */}
        {loading ? (
          <>
            <View style={styles.section}>
              <View style={styles.loadingHeader}>
                <Text style={styles.loadingTitle}>Hotels near you</Text>
              </View>
              <HorizontalHotelSkeleton count={3} />
            </View>
            <View style={styles.section}>
              <View style={styles.loadingHeader}>
                <Text style={styles.loadingTitle}>Hourly Hotels</Text>
              </View>
              <HorizontalHotelSkeleton count={3} />
            </View>
            <View style={styles.section}>
              <View style={styles.loadingHeader}>
                <Text style={styles.loadingTitle}>Nightly Hotels</Text>
              </View>
              <HorizontalHotelSkeleton count={3} />
            </View>
          </>
        ) : (
          <>
            {/* Hotels Near You */}
            {hotels.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Hotels near you" onSeeAllPress={() => { }} />
                <FlatList
                  data={hotels.slice(0, 5)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <HotelCard hotel={item} showDistance={locationEnabled} />
                  )}
                  contentContainerStyle={styles.hotelsScroll}
                />
              </View>
            )}

            {/* Hourly Hotels */}
            {hourlyHotels.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Hourly Hotels" onSeeAllPress={() => { }} />
                <FlatList
                  data={hourlyHotels.slice(0, 5)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <HotelCard hotel={item} showHourlyBadge showDistance={locationEnabled} />
                  )}
                  contentContainerStyle={styles.hotelsScroll}
                />
              </View>
            )}

            {/* Nightly Hotels */}
            {nightlyHotels.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Nightly Hotels" onSeeAllPress={() => { }} />
                <FlatList
                  data={nightlyHotels.slice(0, 5)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <HotelCard hotel={item} showDistance={locationEnabled} />
                  )}
                  contentContainerStyle={styles.hotelsScroll}
                />
              </View>
            )}

            {/* Empty State - Only show if not loading and initial load is complete and no hotels */}
            {!loading && !initialLoad && hotels.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hotels found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              </View>
            )}
          </>
        )}

        {/* Best Deals Section */}
        <View style={styles.section}>
          <SectionHeader title="Best deals for you" onSeeAllPress={() => { }} />
          <FlatList
            data={deals}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DealCard {...item} />}
            contentContainerStyle={styles.dealsScroll}
          />
        </View>

        {/* Hotels on Map Section */}
        {!loading && hotels.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Hotels on Map" subtitle={`${hotels.length} hotels found`} onSeeAllPress={() => { }} />
            <View style={styles.mapSection}>
              <MapView
                hotels={hotels}
                userLocation={userLocation}
                onHotelPress={(_hotelId) => {
                  // Navigate to hotel detail
                  // console.log('Navigate to hotel:', hotelId);
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
    letterSpacing: 0.3,
  },
  priceRangeDisplay: {
    paddingVertical: 8,
  },
  priceRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderColor: '#00D9FF',
  },
  chipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#00D9FF',
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  destinationsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  bannerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  bannerHighlight: {
    color: '#00D9FF',
    fontWeight: '800',
  },
  hotelsScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  dealsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  mapSection: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});