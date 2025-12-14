import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Hotel } from '../types/hotel';

const SEARCH_HISTORY_KEY = 'search_history';
const RECENTLY_VIEWED_KEY = 'recently_viewed';
const FAVORITES_KEY = 'favorites';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: 'location' | 'hotel';
}

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

// Search History Management
export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
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

// Recently Viewed Management
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
      image: hotel.image,
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

// Favorites Management
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

// Hotel Search and Recommendations
export const getRecommendedHotels = async (limit_count: number = 10): Promise<Hotel[]> => {
  try {
    console.log('Fetching recommended hotels...');
    const hotelsRef = collection(db, 'hotels');
    
    // First try without orderBy to avoid index issues
    const q = query(
      hotelsRef,
      where('approved', '==', true),
      where('status', '==', 'active'),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.docs.length} hotels`);
    
    const hotels: Hotel[] = [];
    
    for (const docSnap of snapshot.docs) {
      try {
        const hotelData = docSnap.data();
        console.log(`Processing hotel: ${hotelData.name}`);
        
        // Fetch rooms for this hotel
        const roomsRef = collection(db, 'rooms');
        const roomsQuery = query(roomsRef, where('hotelId', '==', docSnap.id));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        const rooms = roomsSnapshot.docs.map(roomDoc => {
          const roomData = roomDoc.data();
          return {
            id: roomDoc.id,
            type: roomData.roomType || roomData.type || 'Standard Room',
            roomType: roomData.roomType || roomData.type || 'Standard Room',
            price: roomData.price || 0,
            hourlyPrice: roomData.hourlyPrice || 0,
            hourlyRates: roomData.hourlyRates || [],
            bookingType: roomData.bookingType || 'nightly',
            size: roomData.size || '',
            beds: roomData.beds || '',
            capacity: roomData.capacity || 2,
            image: Array.isArray(roomData.images) && roomData.images.length > 0 ? roomData.images[0] : null,
            images: roomData.images || [],
            amenities: roomData.amenities || [],
            originalPrice: roomData.originalPrice || roomData.price || 0,
            roomNumber: roomData.roomNumber || '',
            status: roomData.status || 'active'
          };
        });
        
        console.log(`Hotel ${hotelData.name} has ${rooms.length} rooms`);
        
        if (rooms.length > 0) {
          const roomPrices = rooms.map(room => room.price || 0).filter(p => p > 0);
          const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : hotelData.price || 0;
          
          const hotel: Hotel = {
            id: docSnap.id,
            name: hotelData.name || 'Unnamed Hotel',
            location: hotelData.location || 'Unknown Location',
            address: hotelData.address || '',
            city: hotelData.city || '',
            price: minPrice,
            originalPrice: hotelData.originalPrice || minPrice,
            rating: hotelData.rating || 4.2,
            reviews: hotelData.reviews || 0,
            reviewCount: hotelData.reviewCount || hotelData.reviews || 0,
            stars: hotelData.stars || 3,
            image: Array.isArray(hotelData.images) && hotelData.images.length > 0 
              ? hotelData.images[0] 
              : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
            images: hotelData.images || [],
            videos: hotelData.videos || [],
            amenities: hotelData.amenities || [],
            description: hotelData.description || '',
            email: hotelData.email || '',
            phone: hotelData.phone || '',
            approved: hotelData.approved || false,
            status: hotelData.status || 'inactive',
            rooms: rooms,
            policies: hotelData.policies || {},
            latitude: hotelData.latitude || hotelData.lat,
            longitude: hotelData.longitude || hotelData.lng,
          };
          
          hotels.push(hotel);
        }
      } catch (hotelError) {
        console.error(`Error processing hotel ${docSnap.id}:`, hotelError);
        continue;
      }
    }
    
    // Sort by rating after fetching
    const sortedHotels = hotels.sort((a, b) => b.rating - a.rating);
    console.log(`Returning ${sortedHotels.length} hotels`);
    
    return sortedHotels;
  } catch (error) {
    console.error('Error fetching recommended hotels:', error);
    // Return some mock data if Firebase fails
    return getMockHotels();
  }
};

export const searchHotels = async (searchQuery: string): Promise<Hotel[]> => {
  try {
    console.log(`Searching hotels for: ${searchQuery}`);
    const hotelsRef = collection(db, 'hotels');
    const snapshot = await getDocs(hotelsRef);
    
    const hotels: Hotel[] = [];
    const searchLower = searchQuery.toLowerCase();
    
    for (const docSnap of snapshot.docs) {
      try {
        const hotelData = docSnap.data();
        
        // Check if hotel matches search criteria
        const matchesSearch = 
          hotelData.name?.toLowerCase().includes(searchLower) ||
          hotelData.location?.toLowerCase().includes(searchLower) ||
          hotelData.city?.toLowerCase().includes(searchLower) ||
          hotelData.address?.toLowerCase().includes(searchLower);
        
        if (matchesSearch && hotelData.approved && hotelData.status === 'active') {
          // Fetch rooms for this hotel
          const roomsRef = collection(db, 'rooms');
          const roomsQuery = query(roomsRef, where('hotelId', '==', docSnap.id));
          const roomsSnapshot = await getDocs(roomsQuery);
          
          const rooms = roomsSnapshot.docs.map(roomDoc => {
            const roomData = roomDoc.data();
            return {
              id: roomDoc.id,
              type: roomData.roomType || roomData.type || 'Standard Room',
              roomType: roomData.roomType || roomData.type || 'Standard Room',
              price: roomData.price || 0,
              hourlyPrice: roomData.hourlyPrice || 0,
              hourlyRates: roomData.hourlyRates || [],
              bookingType: roomData.bookingType || 'nightly',
              size: roomData.size || '',
              beds: roomData.beds || '',
              capacity: roomData.capacity || 2,
              image: Array.isArray(roomData.images) && roomData.images.length > 0 ? roomData.images[0] : null,
              images: roomData.images || [],
              amenities: roomData.amenities || [],
              originalPrice: roomData.originalPrice || roomData.price || 0,
              roomNumber: roomData.roomNumber || '',
              status: roomData.status || 'active'
            };
          });
          
          if (rooms.length > 0) {
            const roomPrices = rooms.map(room => room.price || 0).filter(p => p > 0);
            const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : hotelData.price || 0;
            
            const hotel: Hotel = {
              id: docSnap.id,
              name: hotelData.name || 'Unnamed Hotel',
              location: hotelData.location || 'Unknown Location',
              address: hotelData.address || '',
              city: hotelData.city || '',
              price: minPrice,
              originalPrice: hotelData.originalPrice || minPrice,
              rating: hotelData.rating || 4.2,
              reviews: hotelData.reviews || 0,
              reviewCount: hotelData.reviewCount || hotelData.reviews || 0,
              stars: hotelData.stars || 3,
              image: Array.isArray(hotelData.images) && hotelData.images.length > 0 
                ? hotelData.images[0] 
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
              images: hotelData.images || [],
              videos: hotelData.videos || [],
              amenities: hotelData.amenities || [],
              description: hotelData.description || '',
              email: hotelData.email || '',
              phone: hotelData.phone || '',
              approved: hotelData.approved || false,
              status: hotelData.status || 'inactive',
              rooms: rooms,
              policies: hotelData.policies || {},
              latitude: hotelData.latitude || hotelData.lat,
              longitude: hotelData.longitude || hotelData.lng,
            };
            
            hotels.push(hotel);
          }
        }
      } catch (hotelError) {
        console.error(`Error processing search result for hotel ${docSnap.id}:`, hotelError);
        continue;
      }
    }
    
    console.log(`Found ${hotels.length} matching hotels`);
    return hotels.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
};

// Mock data fallback
const getMockHotels = (): Hotel[] => {
  return [
    {
      id: 'mock-1',
      name: 'Terra Cottages Bali',
      location: 'Bingin, Uluwatu, Bali',
      address: 'Jl. Bingin Beach, Uluwatu',
      city: 'Bali',
      price: 38,
      originalPrice: 45,
      rating: 4.7,
      reviews: 124,
      reviewCount: 124,
      stars: 4,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
      images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'],
      videos: [],
      amenities: ['Free WiFi', 'Pool', 'Beach Access'],
      description: 'Beautiful cottages near Bingin Beach',
      email: 'info@terracottages.com',
      phone: '+62123456789',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: -8.8,
      longitude: 115.1,
    },
    {
      id: 'mock-2',
      name: 'Santai by The Koro',
      location: 'Bingin, Uluwatu, Bali',
      address: 'Jl. Pantai Bingin, Uluwatu',
      city: 'Bali',
      price: 29,
      originalPrice: 35,
      rating: 4.8,
      reviews: 89,
      reviewCount: 89,
      stars: 4,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
      images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'],
      videos: [],
      amenities: ['Free WiFi', 'Restaurant', 'Spa'],
      description: 'Peaceful retreat in Uluwatu',
      email: 'info@santaikoro.com',
      phone: '+62123456790',
      approved: true,
      status: 'active',
      rooms: [],
      policies: {},
      latitude: -8.81,
      longitude: 115.11,
    }
  ] as Hotel[];
};