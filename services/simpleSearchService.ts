import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Hotel } from '../types/hotel';

const SEARCH_HISTORY_KEY = 'search_history';
const RECENTLY_VIEWED_KEY = 'recently_viewed';
const FAVORITES_KEY = 'favorites';

// Cache keys and settings
const HOTELS_CACHE_KEY = 'hotels_cache';
const ROOMS_CACHE_KEY = 'rooms_cache';
const LOCATION_SEARCH_CACHE_KEY = 'location_search_cache';
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Cache management functions
const setCacheItem = async <T>(key: string, data: T, expiryMinutes: number = 30): Promise<void> => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryMinutes * 60 * 1000)
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error(`Error setting cache for ${key}:`, error);
  }
};

const getCacheItem = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(cached);
    
    // Check if cache has expired
    if (Date.now() > cacheItem.expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.error(`Error getting cache for ${key}:`, error);
    return null;
  }
};

const clearCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
};

// Helper function to convert image URLs to .jpg format
const convertImageToJpg = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  
  // If it's an Unsplash URL, add format parameter
  if (imageUrl.includes('unsplash.com')) {
    const url = new URL(imageUrl);
    url.searchParams.set('fm', 'jpg');
    url.searchParams.set('q', '80'); // Set quality to 80%
    return url.toString();
  }
  
  // If it's a Cloudinary URL, add format transformation
  if (imageUrl.includes('cloudinary.com')) {
    // Insert f_jpg transformation
    return imageUrl.replace('/upload/', '/upload/f_jpg,q_80/');
  }
  
  // For other URLs, try to replace extension with .jpg
  return imageUrl.replace(/\.(webp|avif|png)(\?.*)?$/i, '.jpg$2');
};

export interface RecentlyViewedItem {
  id: string;
  hotelId: string;
  hotelName: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  timestamp: number;
}

// Simple AsyncStorage functions
export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : ['Bali', 'Jakarta', 'Uluwatu', 'Hotel Bali', 'Villa Uluwatu'];
  } catch (error) {
    console.error('Error getting search history:', error);
    return ['Bali', 'Jakarta', 'Uluwatu', 'Hotel Bali', 'Villa Uluwatu'];
  }
};

export const addToSearchHistory = async (query: string): Promise<void> => {
  try {
    const history = await getSearchHistory();
    const updatedHistory = [query, ...history.filter(item => item !== query)].slice(0, 6);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
};

export const getRecentlyViewed = async (): Promise<RecentlyViewedItem[]> => {
  try {
    const recent = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return recent ? JSON.parse(recent) : [];
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
};

export const addToRecentlyViewed = async (hotel: Hotel): Promise<void> => {
  try {
    const recent = await getRecentlyViewed();
    const newItem: RecentlyViewedItem = {
      id: hotel.id,
      hotelId: hotel.id,
      hotelName: hotel.name,
      location: hotel.location,
      price: hotel.price,
      rating: hotel.rating,
      image: convertImageToJpg(hotel.image),
      timestamp: Date.now()
    };
    
    const updatedRecent = [
      newItem,
      ...recent.filter(item => item.hotelId !== hotel.id)
    ].slice(0, 10);
    
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedRecent));
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (hotelId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    const isFavorite = favorites.includes(hotelId);
    
    let updatedFavorites;
    if (isFavorite) {
      updatedFavorites = favorites.filter(id => id !== hotelId);
    } else {
      updatedFavorites = [...favorites, hotelId];
    }
    
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
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

// Simple Firebase hotel fetching with proper room data and caching
export const getRecommendedHotels = async (limit_count: number = 10): Promise<Hotel[]> => {
  try {
    // Check cache first
    const cacheKey = `${HOTELS_CACHE_KEY}_recommended_${limit_count}`;
    const cachedHotels = await getCacheItem<Hotel[]>(cacheKey);
    
    if (cachedHotels) {
      console.log(`Returning ${cachedHotels.length} hotels from cache`);
      return cachedHotels;
    }
    
    console.log('Fetching hotels from Firebase...');
    const hotelsRef = collection(db, 'hotels');
    const snapshot = await getDocs(hotelsRef);
    
    console.log(`Found ${snapshot.docs.length} total hotels`);
    
    const hotels: Hotel[] = [];
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Include approved and active hotels, or if no approval field exists, include all active
        const isApproved = data.approved === true || data.approved === undefined;
        const isActive = data.status === 'active' || data.status === undefined;
        
        if (isApproved && isActive) {
          console.log(`Processing hotel: ${data.name}`);
          
          // Fetch rooms for this hotel to get pricing
          const roomsRef = collection(db, 'rooms');
          const roomsQuery = query(roomsRef, where('hotelId', '==', doc.id));
          const roomsSnapshot = await getDocs(roomsQuery);
          
          const rooms = roomsSnapshot.docs.map(roomDoc => {
            const roomData = roomDoc.data() as any;
            return {
              id: roomDoc.id,
              type: roomData.roomType || roomData.type || 'Standard Room',
              roomType: roomData.roomType || roomData.type || 'Standard Room',
              price: getSafeNumber(roomData.price, 0),
              hourlyPrice: getSafeNumber(roomData.hourlyPrice, 0),
              hourlyRates: roomData.hourlyRates || [],
              bookingType: roomData.bookingType || 'nightly',
              size: roomData.size || '',
              beds: roomData.beds || '',
              capacity: getSafeNumber(roomData.capacity, 2),
              image: Array.isArray(roomData.images) && roomData.images.length > 0 ? convertImageToJpg(roomData.images[0]) : null,
              images: (roomData.images || []).map(convertImageToJpg),
              amenities: roomData.amenities || [],
              originalPrice: getSafeNumber(roomData.originalPrice, roomData.price || 0),
              roomNumber: roomData.roomNumber || '',
              status: roomData.status || 'active'
            };
          });
          
          console.log(`Hotel ${data.name} has ${rooms.length} rooms`);
          
          // Calculate pricing from rooms
          let minPrice = 0;
          let minOriginalPrice = 0;
          let hasNightly = false;
          let hasHourly = false;
          
          if (rooms.length > 0) {
            const nightlyRooms = rooms.filter(room => 
              room.bookingType === 'nightly' || room.bookingType === 'both'
            );
            const hourlyRooms = rooms.filter(room => 
              room.bookingType === 'hourly' || room.bookingType === 'both'
            );
            
            hasNightly = nightlyRooms.length > 0;
            hasHourly = hourlyRooms.length > 0;
            
            // Get minimum nightly price
            if (hasNightly) {
              const nightlyPrices = nightlyRooms.map(room => room.price).filter(p => p > 0);
              if (nightlyPrices.length > 0) {
                minPrice = Math.min(...nightlyPrices);
              }
            }
            
            // If no nightly price, use hourly price
            if (minPrice === 0 && hasHourly) {
              const hourlyPrices = hourlyRooms.map(room => room.hourlyPrice).filter(p => p > 0);
              if (hourlyPrices.length > 0) {
                minPrice = Math.min(...hourlyPrices);
              }
            }
            
            // Calculate original price
            const originalPrices = rooms.map(room => room.originalPrice).filter(p => p > 0);
            if (originalPrices.length > 0) {
              minOriginalPrice = Math.min(...originalPrices);
            } else {
              minOriginalPrice = minPrice;
            }
          }
          
          // Generate rating from stars or use default
          const rating = data.stars ? data.stars * 0.9 : 4.2; // Convert 5-star to 4.5 rating
          
          const hotel: Hotel = {
            id: doc.id,
            name: data.name || 'Unnamed Hotel',
            location: data.location || 'Unknown Location',
            address: data.address || '',
            city: data.city || '',
            price: minPrice || 1500, // Default price if no rooms
            originalPrice: minOriginalPrice || minPrice || 1800,
            rating: getSafeNumber(rating, 4.2),
            reviews: getSafeNumber(data.reviews, Math.floor(Math.random() * 200) + 50),
            reviewCount: getSafeNumber(data.reviewCount, Math.floor(Math.random() * 200) + 50),
            stars: getSafeNumber(data.stars, 4),
            image: Array.isArray(data.images) && data.images.length > 0 
              ? convertImageToJpg(data.images[0])
              : convertImageToJpg('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'),
            images: (data.images || []).map(convertImageToJpg),
            videos: data.videos || [],
            amenities: data.amenities || ['Free WiFi'],
            description: data.description || 'No description available',
            email: data.email || '',
            phone: data.phone || '',
            approved: data.approved || false,
            status: data.status || 'inactive',
            rooms: rooms,
            policies: data.policies || {},
            latitude: getSafeNumber(data.latitude, 0),
            longitude: getSafeNumber(data.longitude, 0),
            available: hasNightly || hasHourly,
          };
          
          // Add booking type info to hotel object for display
          (hotel as any).hasNightly = hasNightly;
          (hotel as any).hasHourly = hasHourly;
          
          hotels.push(hotel);
        }
      } catch (hotelError) {
        console.error(`Error processing hotel ${doc.id}:`, hotelError);
      }
    }
    
    console.log(`Returning ${hotels.length} approved hotels with rooms`);
    
    // Sort by rating and return limited results
    const sortedHotels = hotels
      .filter(hotel => hotel.rooms.length > 0) // Only hotels with rooms
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit_count);
    
    // If no hotels found, return mock data
    if (sortedHotels.length === 0) {
      console.log('No hotels found, returning mock data');
      const mockHotels = getMockHotels();
      // Cache mock data for shorter time (5 minutes)
      await setCacheItem(cacheKey, mockHotels, 5);
      return mockHotels;
    }
    
    // Cache the results for 30 minutes
    await setCacheItem(cacheKey, sortedHotels, 30);
    console.log(`Cached ${sortedHotels.length} hotels for future requests`);
    
    return sortedHotels;
  } catch (error) {
    console.error('Error fetching recommended hotels:', error);
    console.log('Returning mock data due to error');
    return getMockHotels();
  }
};

// Search hotels by location coordinates with caching
export const searchHotelsByLocation = async (
  latitude: number, 
  longitude: number, 
  radiusKm: number = 50
): Promise<Hotel[]> => {
  try {
    // Create cache key based on location and radius
    const cacheKey = `${LOCATION_SEARCH_CACHE_KEY}_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radiusKm}`;
    const cachedResults = await getCacheItem<Hotel[]>(cacheKey);
    
    if (cachedResults) {
      console.log(`Returning ${cachedResults.length} hotels from location cache`);
      return cachedResults;
    }
    
    console.log(`Searching hotels near coordinates: ${latitude}, ${longitude}`);
    const hotelsRef = collection(db, 'hotels');
    
    // First try to get all hotels and filter
    const snapshot = await getDocs(hotelsRef);
    console.log(`Found ${snapshot.docs.length} total hotels in database`);
    
    const hotels: Hotel[] = [];
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        console.log(`Processing hotel: ${data.name}, approved: ${data.approved}, status: ${data.status}`);
        
        // Only include approved and active hotels, or if no approval field exists, include all active
        const isApproved = data.approved === true || data.approved === undefined;
        const isActive = data.status === 'active' || data.status === undefined;
        
        if (isApproved && isActive) {
          const hotelLat = getSafeNumber(data.latitude || data.lat);
          const hotelLng = getSafeNumber(data.longitude || data.lng);
          
          // Calculate distance if hotel has coordinates
          let distance = 0;
          let includeHotel = false;
          
          if (hotelLat && hotelLng) {
            distance = calculateDistance(latitude, longitude, hotelLat, hotelLng);
            includeHotel = distance <= radiusKm;
            console.log(`Hotel ${data.name} distance: ${distance.toFixed(2)} km`);
          } else {
            // If no coordinates, check if city matches the search area
            // For Kanpur coordinates (26.4499, 80.3319), include Kanpur hotels
            const cityMatch = checkCityMatch(latitude, longitude, data.city || data.location);
            includeHotel = cityMatch;
            distance = cityMatch ? 5 : 999; // Assign a default distance for city matches
            console.log(`Hotel ${data.name} city match: ${cityMatch}, city: ${data.city || data.location}`);
          }
          
          if (includeHotel) {
            // Fetch rooms for pricing
            const roomsRef = collection(db, 'rooms');
            const roomsQuery = query(roomsRef, where('hotelId', '==', doc.id));
            const roomsSnapshot = await getDocs(roomsQuery);
            
            const rooms = roomsSnapshot.docs.map(roomDoc => {
              const roomData = roomDoc.data() as any;
              return {
                id: roomDoc.id,
                type: roomData.roomType || roomData.type || 'Standard Room',
                roomType: roomData.roomType || roomData.type || 'Standard Room',
                price: getSafeNumber(roomData.price, 0),
                hourlyPrice: getSafeNumber(roomData.hourlyPrice, 0),
                hourlyRates: roomData.hourlyRates || [],
                bookingType: roomData.bookingType || 'nightly',
                size: roomData.size || '',
                beds: roomData.beds || '',
                capacity: getSafeNumber(roomData.capacity, 2),
                image: Array.isArray(roomData.images) && roomData.images.length > 0 ? convertImageToJpg(roomData.images[0]) : null,
                images: (roomData.images || []).map(convertImageToJpg),
                amenities: roomData.amenities || [],
                originalPrice: getSafeNumber(roomData.originalPrice, roomData.price || 0),
                roomNumber: roomData.roomNumber || '',
                status: roomData.status || 'active'
              };
            });
            
            // Calculate pricing from rooms
            let minPrice = 0;
            let minOriginalPrice = 0;
            let hasNightly = false;
            let hasHourly = false;
            
            if (rooms.length > 0) {
              const nightlyRooms = rooms.filter(room => 
                room.bookingType === 'nightly' || room.bookingType === 'both'
              );
              const hourlyRooms = rooms.filter(room => 
                room.bookingType === 'hourly' || room.bookingType === 'both'
              );
              
              hasNightly = nightlyRooms.length > 0;
              hasHourly = hourlyRooms.length > 0;
              
              // Get minimum nightly price
              if (hasNightly) {
                const nightlyPrices = nightlyRooms.map(room => room.price).filter(p => p > 0);
                if (nightlyPrices.length > 0) {
                  minPrice = Math.min(...nightlyPrices);
                }
              }
              
              // If no nightly price, use hourly price
              if (minPrice === 0 && hasHourly) {
                const hourlyPrices = hourlyRooms.map(room => room.hourlyPrice).filter(p => p > 0);
                if (hourlyPrices.length > 0) {
                  minPrice = Math.min(...hourlyPrices);
                }
              }
              
              // Calculate original price
              const originalPrices = rooms.map(room => room.originalPrice).filter(p => p > 0);
              if (originalPrices.length > 0) {
                minOriginalPrice = Math.min(...originalPrices);
              } else {
                minOriginalPrice = minPrice;
              }
            }
            
            // Only include hotels with rooms
            if (rooms.length > 0) {
              const rating = data.stars ? data.stars * 0.9 : 4.2;
              
              const hotel: Hotel = {
                id: doc.id,
                name: data.name || 'Unnamed Hotel',
                location: data.location || 'Unknown Location',
                address: data.address || '',
                city: data.city || '',
                price: minPrice || 1500,
                originalPrice: minOriginalPrice || minPrice || 1800,
                rating: getSafeNumber(rating, 4.2),
                reviews: getSafeNumber(data.reviews, Math.floor(Math.random() * 200) + 50),
                reviewCount: getSafeNumber(data.reviewCount, Math.floor(Math.random() * 200) + 50),
                stars: getSafeNumber(data.stars, 4),
                image: Array.isArray(data.images) && data.images.length > 0 
                  ? convertImageToJpg(data.images[0])
                  : convertImageToJpg('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'),
                images: (data.images || []).map(convertImageToJpg),
                videos: data.videos || [],
                amenities: data.amenities || ['Free WiFi'],
                description: data.description || 'No description available',
                email: data.email || '',
                phone: data.phone || '',
                approved: data.approved || false,
                status: data.status || 'inactive',
                rooms: rooms,
                policies: data.policies || {},
                latitude: hotelLat,
                longitude: hotelLng,
                distance: distance,
                available: hasNightly || hasHourly,
              };
              
              // Add booking type info
              (hotel as any).hasNightly = hasNightly;
              (hotel as any).hasHourly = hasHourly;
              
              hotels.push(hotel);
            }
          }
        }
      } catch (hotelError) {
        console.error(`Error processing hotel ${doc.id}:`, hotelError);
      }
    }
    
    // Sort by distance (closest first)
    const sortedHotels = hotels.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Cache the results for 15 minutes (shorter than recommendations since location-specific)
    await setCacheItem(cacheKey, sortedHotels, 15);
    console.log(`Found and cached ${sortedHotels.length} hotels near location`);
    
    return sortedHotels;
  } catch (error) {
    console.error('Error searching hotels by location:', error);
    return getMockNearbyHotels();
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if a city matches the search coordinates
const checkCityMatch = (searchLat: number, searchLng: number, hotelCity: string): boolean => {
  if (!hotelCity) return false;
  
  const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'kanpur': { lat: 26.4499, lng: 80.3319 },
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'agra': { lat: 27.1767, lng: 78.0081 },
    'varanasi': { lat: 25.3176, lng: 82.9739 },
  };
  
  const normalizedCity = hotelCity.toLowerCase().trim();
  const cityCoords = cityCoordinates[normalizedCity];
  
  if (cityCoords) {
    const distance = calculateDistance(searchLat, searchLng, cityCoords.lat, cityCoords.lng);
    return distance <= 50; // Within 50km of the city center
  }
  
  // Fallback: check if any known city name is in the hotel city string
  for (const [cityName, coords] of Object.entries(cityCoordinates)) {
    if (normalizedCity.includes(cityName)) {
      const distance = calculateDistance(searchLat, searchLng, coords.lat, coords.lng);
      return distance <= 50;
    }
  }
  
  return false;
};

// Cache management exports
export const clearHotelsCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(HOTELS_CACHE_KEY) || 
      key.startsWith(LOCATION_SEARCH_CACHE_KEY) ||
      key.startsWith(ROOMS_CACHE_KEY)
    );
    
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    console.error('Error clearing hotels cache:', error);
  }
};

export const getCacheStats = async (): Promise<{
  totalCacheEntries: number;
  hotelsCacheSize: number;
  locationCacheSize: number;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const hotelsCacheKeys = keys.filter(key => key.startsWith(HOTELS_CACHE_KEY));
    const locationCacheKeys = keys.filter(key => key.startsWith(LOCATION_SEARCH_CACHE_KEY));
    
    return {
      totalCacheEntries: hotelsCacheKeys.length + locationCacheKeys.length,
      hotelsCacheSize: hotelsCacheKeys.length,
      locationCacheSize: locationCacheKeys.length,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalCacheEntries: 0, hotelsCacheSize: 0, locationCacheSize: 0 };
  }
};

// Mock nearby hotels for fallback
const getMockNearbyHotels = (): Hotel[] => {
  const baseHotels = [
    {
      id: 'nearby-1',
      name: 'Luxury Resort & Spa',
      location: 'City Center',
      address: 'Main Street, Downtown',
      city: 'Selected City',
      price: 3500,
      originalPrice: 4200,
      rating: 4.8,
      reviews: 245,
      reviewCount: 245,
      stars: 5,
      image: convertImageToJpg('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600'),
      images: [convertImageToJpg('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600')],
      videos: [],
      amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Gym', 'parking'],
      description: 'Luxury resort in the heart of the city',
      email: 'info@luxuryresort.com',
      phone: '+1234567890',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: 0,
      longitude: 0,
      distance: 2.5,
    },
    {
      id: 'nearby-2',
      name: 'Boutique Hotel Downtown',
      location: 'Business District',
      address: 'Business Avenue',
      city: 'Selected City',
      price: 2200,
      originalPrice: 2800,
      rating: 4.6,
      reviews: 156,
      reviewCount: 156,
      stars: 4,
      image: convertImageToJpg('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600'),
      images: [convertImageToJpg('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600')],
      videos: [],
      amenities: ['Free WiFi', 'Business Center', 'Restaurant', 'Air Conditioning'],
      description: 'Modern boutique hotel for business travelers',
      email: 'info@boutiquehotel.com',
      phone: '+1234567891',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: 0,
      longitude: 0,
      distance: 3.2,
    }
  ];

  return baseHotels.map(hotel => {
    const extendedHotel = hotel as any;
    extendedHotel.hasNightly = true;
    extendedHotel.hasHourly = Math.random() > 0.5;
    return extendedHotel;
  });
};

// Mock data for fallback
const getMockHotels = (): Hotel[] => {
  return [
    {
      id: 'mock-1',
      name: 'Grand Palace Hotel',
      location: 'Central Delhi',
      address: 'Connaught Place, New Delhi',
      city: 'Delhi',
      price: 2800,
      originalPrice: 3500,
      rating: 4.7,
      reviews: 324,
      reviewCount: 324,
      stars: 5,
      image: convertImageToJpg('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'),
      images: [convertImageToJpg('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600')],
      videos: [],
      amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'parking', 'Air Conditioning'],
      description: 'Luxury hotel in the heart of Delhi',
      email: 'info@grandpalace.com',
      phone: '+911234567890',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: 28.6139,
      longitude: 77.2090,
    },
    {
      id: 'mock-2',
      name: 'Business Inn Express',
      location: 'Gurgaon',
      address: 'Cyber City, Gurgaon',
      city: 'Gurgaon',
      price: 1800,
      originalPrice: 2200,
      rating: 4.4,
      reviews: 189,
      reviewCount: 189,
      stars: 4,
      image: convertImageToJpg('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'),
      images: [convertImageToJpg('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600')],
      videos: [],
      amenities: ['Free WiFi', 'Business Center', 'Restaurant', 'Gym'],
      description: 'Modern business hotel in Cyber City',
      email: 'info@businessinn.com',
      phone: '+911234567891',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: 28.4595,
      longitude: 77.0266,
    },
    {
      id: 'mock-3',
      name: 'Heritage Boutique',
      location: 'Old Delhi',
      address: 'Chandni Chowk, Old Delhi',
      city: 'Delhi',
      price: 1500,
      originalPrice: 1800,
      rating: 4.6,
      reviews: 256,
      reviewCount: 256,
      stars: 4,
      image: convertImageToJpg('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'),
      images: [convertImageToJpg('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600')],
      videos: [],
      amenities: ['Free WiFi', 'Restaurant', 'Cultural Tours', 'Heritage Rooms'],
      description: 'Traditional boutique hotel in historic Old Delhi',
      email: 'info@heritageboutique.com',
      phone: '+911234567892',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: 28.6562,
      longitude: 77.2410,
    }
  ].map(hotel => ({
    ...hotel,
    hasNightly: true,
    hasHourly: Math.random() > 0.3, // 70% chance of hourly availability
  })) as (Hotel & { hasNightly: boolean; hasHourly: boolean })[];
};