import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hotel } from '../types/hotel';

const HOTELS_CACHE_KEY = 'hotels_cache';
const CACHE_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

interface HotelCacheData {
  hotels: Hotel[];
  timestamp: number;
  expiry: number;
}

// Save hotels to cache
export const saveHotelsToCache = async (hotels: Hotel[]): Promise<void> => {
  try {
    const cacheData: HotelCacheData = {
      hotels,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY_TIME,
    };
    await AsyncStorage.setItem(HOTELS_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`Cached ${hotels.length} hotels`);
  } catch (error) {
    console.error('Error saving hotels to cache:', error);
  }
};

// Get hotels from cache
export const getHotelsFromCache = async (): Promise<Hotel[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(HOTELS_CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: HotelCacheData = JSON.parse(cached);
    
    // Check if cache has expired
    if (Date.now() > cacheData.expiry) {
      await AsyncStorage.removeItem(HOTELS_CACHE_KEY);
      console.log('Hotel cache expired, removed');
      return null;
    }
    
    console.log(`Retrieved ${cacheData.hotels.length} hotels from cache`);
    return cacheData.hotels;
  } catch (error) {
    console.error('Error getting hotels from cache:', error);
    return null;
  }
};

// Clear hotel cache
export const clearHotelCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HOTELS_CACHE_KEY);
    console.log('Hotel cache cleared');
  } catch (error) {
    console.error('Error clearing hotel cache:', error);
  }
};

// Check if cache is valid
export const isCacheValid = async (): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(HOTELS_CACHE_KEY);
    if (!cached) return false;
    
    const cacheData: HotelCacheData = JSON.parse(cached);
    return Date.now() < cacheData.expiry;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};