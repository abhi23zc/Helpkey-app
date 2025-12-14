import { MapPin, X, ArrowLeft, Building2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
  Keyboard,
} from 'react-native';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface LocationSearchInputProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    description: string;
    placeId: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  googleMapsApiKey: string;
}

export default function LocationSearchInput({
  visible,
  onClose,
  onLocationSelect,
  googleMapsApiKey,
}: LocationSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Generate a session token for billing optimization
  useEffect(() => {
    setSessionToken(Math.random().toString(36).substring(7));
  }, []);

  // Auto-focus the input when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !googleMapsApiKey) return;

    setLoading(true);
    try {
      // Search for both cities and establishments (hotels)
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${googleMapsApiKey}&sessiontoken=${sessionToken}&components=country:in&types=geocode|establishment`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
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
    const details = await getPlaceDetails(prediction.place_id);
    setLoading(false);

    onLocationSelect({
      description: prediction.description,
      placeId: prediction.place_id,
      latitude: details?.latitude,
      longitude: details?.longitude,
    });

    // Reset for next search
    setSearchQuery('');
    setPredictions([]);
    setSessionToken(Math.random().toString(36).substring(7));
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    setPredictions([]);
  };

  // Separate predictions into locations and hotels
  const locationPredictions = predictions.filter(p => 
    p.types.some(type => ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'sublocality'].includes(type))
  );
  
  const hotelPredictions = predictions.filter(p => 
    p.types.some(type => ['lodging', 'establishment'].includes(type)) && 
    !p.types.some(type => ['locality', 'administrative_area_level_1'].includes(type))
  );

  const renderPredictionItem = ({ item, isHotel = false }: { item: PlacePrediction; isHotel?: boolean }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handleSelectPlace(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.predictionIcon, isHotel && styles.hotelIcon]}>
        {isHotel ? (
          <Building2 size={18} color="#666" />
        ) : (
          <MapPin size={18} color="#00BCD4" />
        )}
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        {/* Header with Search Bar */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <MapPin size={20} color="#00BCD4" />
            </View>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search destinations, hotels..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={handleClear} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <X size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00BCD4" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Results */}
          {!loading && predictions.length > 0 && (
            <FlatList
              data={[]}
              ListHeaderComponent={
                <View>
                  {/* Location Section */}
                  {locationPredictions.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Location</Text>
                      {locationPredictions.map((item) => (
                        <View key={item.place_id}>
                          {renderPredictionItem({ item })}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Hotels Section */}
                  {hotelPredictions.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Hotel and Villas</Text>
                      {hotelPredictions.map((item) => (
                        <View key={item.place_id}>
                          {renderPredictionItem({ item, isHotel: true })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Empty State */}
          {!loading && searchQuery.length > 0 && predictions.length === 0 && (
            <View style={styles.emptyContainer}>
              <MapPin size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for a different location or hotel
              </Text>
            </View>
          )}

          {/* Initial State */}
          {!loading && searchQuery.length === 0 && (
            <View style={styles.initialContainer}>
              <View style={styles.initialIcon}>
                <MapPin size={32} color="#00BCD4" />
              </View>
              <Text style={styles.initialTitle}>Where are you going?</Text>
              <Text style={styles.initialSubtext}>
                Search for destinations, cities, or specific hotels
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#00BCD4',
    gap: 12,
  },
  searchIcon: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#fff',
  },
  predictionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelIcon: {
    backgroundColor: '#f5f5f5',
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BCD4',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  initialContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  initialIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  initialTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  initialSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
