import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AirVent,
    Car,
    Coffee,
    Dumbbell,
    Search,
    Tv,
    UtensilsCrossed,
    Waves,
    Wifi
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Categorize amenities
const categorizeAmenities = (amenities: string[]) => {
  const categories: { [key: string]: string[] } = {
    'Amenities For Couples': [],
    Important: [],
    Services: [],
    'Food & Beverages': [],
    Business: [],
    'General Amenities': [],
  };

  amenities.forEach((amenity) => {
    if (!amenity) return;
    const amenityStr = typeof amenity === 'string' ? amenity : String(amenity);
    const amenityLower = amenityStr.toLowerCase();

    if (
      amenityLower.includes('bar') ||
      amenityLower.includes('shuttle') ||
      amenityLower.includes('multilingual')
    ) {
      categories['Amenities For Couples'].push(amenityStr);
    } else if (
      amenityLower.includes('air conditioning') ||
      amenityLower.includes('ac') ||
      amenityLower.includes('parking') ||
      amenityLower.includes('security')
    ) {
      categories['Important'].push(amenityStr);
    } else if (
      amenityLower.includes('service') ||
      amenityLower.includes('printing') ||
      amenityLower.includes('photocopy')
    ) {
      categories['Services'].push(amenityStr);
    } else if (
      amenityLower.includes('restaurant') ||
      amenityLower.includes('bar') ||
      amenityLower.includes('food') ||
      amenityLower.includes('breakfast')
    ) {
      categories['Food & Beverages'].push(amenityStr);
    } else if (
      amenityLower.includes('business') ||
      amenityLower.includes('conference') ||
      amenityLower.includes('banquet')
    ) {
      categories['Business'].push(amenityStr);
    } else {
      categories['General Amenities'].push(amenityStr);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach((key) => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
};

export default function AmenitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const amenitiesParam = params.amenities as string;
  const hotelName = (params.hotelName as string) || 'Hotel';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');

  // Parse amenities from params
  const allAmenities = amenitiesParam ? JSON.parse(amenitiesParam) : [];
  const categorizedAmenities = categorizeAmenities(allAmenities);
  const tabs = ['All', ...Object.keys(categorizedAmenities)];

  // Filter amenities based on search
  const filterAmenities = (amenities: string[]) => {
    if (!searchQuery.trim()) return amenities;
    return amenities.filter((amenity) => {
      if (!amenity) return false;
      const amenityStr = typeof amenity === 'string' ? amenity : String(amenity);
      return amenityStr.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const renderAmenityItem = (amenity: string, index: number) => {
    const amenityStr = typeof amenity === 'string' ? amenity : String(amenity || '');
    const IconComponent = amenityIcons[amenityStr] || Wifi;

    return (
      <View key={index} style={styles.amenityItem}>
        <View style={styles.amenityIcon}>
          <IconComponent size={20} color="#666" strokeWidth={2} />
        </View>
        <Text style={styles.amenityText}>{amenityStr.replace(/-/g, ' ')}</Text>
      </View>
    );
  };

  const renderCategory = (categoryName: string, amenities: string[]) => {
    const filteredAmenities = filterAmenities(amenities);
    if (filteredAmenities.length === 0) return null;

    return (
      <View key={categoryName} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        <View style={styles.amenitiesGrid}>
          {filteredAmenities.map((amenity, index) => renderAmenityItem(amenity, index))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (selectedTab === 'All') {
      return Object.entries(categorizedAmenities).map(([category, amenities]) =>
        renderCategory(category, amenities)
      );
    } else {
      const amenities = categorizedAmenities[selectedTab] || [];
      return renderCategory(selectedTab, amenities);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

     
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#999" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search amenities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#0066FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 12,
  },
  amenityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
});
