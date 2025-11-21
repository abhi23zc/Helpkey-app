import { SlidersHorizontal } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import DestinationItem from '@/components/home/DestinationItem';
import FiltersPanel from '@/components/home/FiltersPanel';
import GradientHeader from '@/components/home/GradientHeader';
import HotelCard from '@/components/home/HotelCard';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import MapView from '@/components/home/MapView';
import SectionHeader from '@/components/home/SectionHeader';

const popularDestinations = [
  { id: '1', name: 'Gurgaon', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200' },
  { id: '2', name: 'Coimbatore', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=200' },
  { id: '3', name: 'New Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200' },
  { id: '4', name: 'Kolkata', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=200' },
  { id: '5', name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' },
  { id: '6', name: 'Jaipur', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=200' },
];

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

  // Fetch hotels with rooms
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
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
        }

        setAllHotels(fetchedHotels);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setLoading(false);
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
    if (!locationEnabled) {
      setShowLocationModal(true);
    }
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

        {/* Popular Destinations */}
        <View style={styles.section}>
          <SectionHeader title="Popular destinations" onSeeAllPress={() => { }} />
          <FlatList
            data={popularDestinations}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DestinationItem {...item} />}
            contentContainerStyle={styles.destinationsScroll}
          />
        </View>

        {/* Hotels Count Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>
            Book <Text style={styles.bannerHighlight}>{allHotels.length}+</Text> Hotels across{' '}
            <Text style={styles.bannerHighlight}>20+</Text> cities
          </Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.loadingText}>Loading hotels...</Text>
          </View>
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

            {/* Empty State */}
            {hotels.length === 0 && (
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
                onHotelPress={(hotelId) => {
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
    backgroundColor: '#F8F9FA',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  priceRangeDisplay: {
    paddingVertical: 8,
  },
  priceRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0066FF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
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
  },
  bannerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  bannerHighlight: {
    color: '#0066FF',
    fontWeight: '700',
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
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  mapSection: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
});
