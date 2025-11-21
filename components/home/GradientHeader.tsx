import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin, Search as SearchIcon } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface GradientHeaderProps {
  userName: string;
  userPhoto?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onNotificationPress?: () => void;
  userLocation?: string;
  onLocationPress?: () => void;
}

const GradientHeader = ({
  userName,
  userPhoto,
  searchQuery,
  onSearchChange,
  onNotificationPress,
  userLocation = 'India',
  onLocationPress,
}: GradientHeaderProps) => {
  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#7e8ba3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientHeader}
    >
      <View style={styles.headerTop}>
        <TouchableOpacity>
          <Image
            source={{
              uri:
                userPhoto ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
            }}
            contentFit="cover"
            transition={200}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationContainer} onPress={onLocationPress}>
          <MapPin size={16} color="#fff" />
          <Text style={styles.locationText}>{userLocation}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
          <Bell size={22} color="#fff" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Hero Text */}
      <View style={styles.heroSection}>
        <Text style={styles.heroText}>
          Find <Text style={styles.heroHighlight}>Hotels, Villas,</Text>
        </Text>
        <Text style={styles.heroText}>
          <Text style={styles.heroHighlight}>Lodging,</Text> that are around you!
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Find the best Hotels"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <SearchIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  heroSection: {
    marginBottom: 30,
  },
  heroText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '400',
    lineHeight: 38,
  },
  heroHighlight: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    fontSize: 15,
    color: '#fff',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GradientHeader;
