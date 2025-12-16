import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MapPin, X, Search as SearchIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Mock predictions for common Indian cities and locations
const getMockPredictions = (query: string): PlacePrediction[] => {
  const cities = [
    { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
    { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
    { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
    { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
    { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
    { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  ];

  const normalizedQuery = query.toLowerCase().trim();

  return cities
    .filter(city =>
      city.name.toLowerCase().includes(normalizedQuery) ||
      city.state.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5)
    .map((city, index) => ({
      place_id: `mock_${city.name.toLowerCase()}_${index}`,
      description: `${city.name}, ${city.state}, India`,
      structured_formatting: {
        main_text: city.name,
        secondary_text: `${city.state}, India`
      },
      // Store coordinates in a custom property for mock data
      geometry: {
        location: {
          lat: city.lat,
          lng: city.lng
        }
      }
    }));
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface InlineLocationSearchProps {
  onLocationSelect: (location: {
    description: string;
    placeId: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  googleMapsApiKey: string;
  placeholder?: string;
  onSearchChange?: (query: string) => void;
  onClear?: () => void;
}

export default function InlineLocationSearch({
  onLocationSelect,
  googleMapsApiKey,
  placeholder = "Search hotel or location",
  onSearchChange,
  onClear
}: InlineLocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Generate session token
  useEffect(() => {
    setSessionToken(Math.random().toString(36).substring(7));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    // Don't search if a location is already selected
    if (isLocationSelected) {
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isLocationSelected]);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !googleMapsApiKey) return;

    setLoading(true);
    setShowResults(true);

    try {
      // Use a proxy or different approach for mobile apps
      // For now, let's use a simpler approach with mock data for common Indian cities
      const mockPredictions = getMockPredictions(query);

      if (mockPredictions.length > 0) {
        setPredictions(mockPredictions);
      } else {
        // Try the API call (might work in some environments)
        try {
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=${googleMapsApiKey}&sessiontoken=${sessionToken}&components=country:in&types=(cities)`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.status === 'OK' && data.predictions) {
            setPredictions(data.predictions);
          } else {
            console.log('API response:', data);
            setPredictions(mockPredictions);
          }
        } catch (apiError) {
          console.log('API call failed, using mock data:', apiError);
          setPredictions(mockPredictions);
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string, prediction?: PlacePrediction) => {
    try {
      // Handle mock data
      if (placeId.startsWith('mock_') && prediction && (prediction as any).geometry) {
        const geometry = (prediction as any).geometry;
        return {
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
          address: prediction.description,
        };
      }

      // Try real API call
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleMapsApiKey}&sessiontoken=${sessionToken}&fields=geometry,formatted_address`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          address: data.result.formatted_address,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return null;
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setLoading(true);

    // Hide results immediately to prevent re-showing
    setShowResults(false);
    setPredictions([]);

    const details = await getPlaceDetails(prediction.place_id, prediction);
    setLoading(false);

    // Mark that a location has been selected
    setIsLocationSelected(true);

    // Update the search query to show the selected location
    setSearchQuery(prediction.structured_formatting.main_text);

    // Blur the input to remove focus
    searchInputRef.current?.blur();

    onLocationSelect({
      description: prediction.description,
      placeId: prediction.place_id,
      latitude: details?.latitude,
      longitude: details?.longitude,
    });

    setSessionToken(Math.random().toString(36).substring(7));
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Reset location selected state when user starts typing
    if (isLocationSelected) {
      setIsLocationSelected(false);
    }

    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPredictions([]);
    setShowResults(false);
    setIsLocationSelected(false);
    if (onClear) {
      onClear();
    }
    searchInputRef.current?.focus();
  };

  const renderPredictionItem = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handleSelectPlace(item)}
      activeOpacity={0.7}
    >
      <View style={styles.predictionIcon}>
        <MapPin size={16} color="#0EA5E9" />
      </View>
      <View style={styles.predictionText}>
        <Text style={styles.predictionMain} numberOfLines={1}>
          {item.structured_formatting.main_text}
        </Text>
        {item.structured_formatting.secondary_text && (
          <Text style={styles.predictionSecondary} numberOfLines={1}>
            {item.structured_formatting.secondary_text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[
        styles.searchContainer,
        isLocationSelected && styles.searchContainerSelected
      ]}>
        {isLocationSelected ? (
          <MapPin size={isTablet ? 22 : 20} color="#0EA5E9" />
        ) : (
          <SearchIcon size={isTablet ? 22 : 20} color="#6B7280" />
        )}
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => {
            // Only show results if there's a query and no location is selected
            if (searchQuery && !isLocationSelected && predictions.length > 0) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Hide results when input loses focus (with a small delay to allow for selection)
            setTimeout(() => {
              if (!isLocationSelected) {
                setShowResults(false);
              }
            }, 150);
          }}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
        {loading && (
          <ActivityIndicator size="small" color="#0EA5E9" style={styles.loadingIndicator} />
        )}
      </View>

      {/* Search Results */}
      {showResults && (predictions.length > 0 || loading) && (
        <View style={styles.resultsContainer}>
          {loading && predictions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0EA5E9" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={predictions}
              renderItem={renderPredictionItem}
              keyExtractor={(item) => item.place_id}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 14,
    gap: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContainerSelected: {
    backgroundColor: '#E0F2FE', // Sky 50
    borderColor: '#0EA5E9', // Sky 500
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    color: '#111827',
    padding: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: 300,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE', // Sky 50
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: isTablet ? 14 : 13,
    color: '#6B7280',
  },
});