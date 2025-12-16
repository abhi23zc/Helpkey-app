import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_LOCATION_KEY = 'selected_location';

export interface StoredLocation {
  description: string;
  placeId: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

// Save selected location to storage
export const saveSelectedLocation = async (location: {
  description: string;
  placeId: string;
  latitude?: number;
  longitude?: number;
}): Promise<void> => {
  try {
    const storedLocation: StoredLocation = {
      ...location,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(SELECTED_LOCATION_KEY, JSON.stringify(storedLocation));
    console.log('Location saved:', storedLocation);
  } catch (error) {
    console.error('Error saving selected location:', error);
  }
};

// Get selected location from storage
export const getSelectedLocation = async (): Promise<StoredLocation | null> => {
  try {
    const stored = await AsyncStorage.getItem(SELECTED_LOCATION_KEY);
    if (stored) {
      const location: StoredLocation = JSON.parse(stored);
      console.log('Location retrieved:', location);
      return location;
    }
    return null;
  } catch (error) {
    console.error('Error getting selected location:', error);
    return null;
  }
};

// Clear selected location
export const clearSelectedLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SELECTED_LOCATION_KEY);
    console.log('Location cleared');
  } catch (error) {
    console.error('Error clearing selected location:', error);
  }
};

// Check if location is recent (within last 24 hours)
export const isLocationRecent = (location: StoredLocation): boolean => {
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return Date.now() - location.timestamp < twentyFourHours;
};