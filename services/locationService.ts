import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    // First check if we already have permission
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }
    
    // If not granted, request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 Location permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<UserLocation | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('📍 Location permission not granted');
      return null;
    }

    // Check if location services are enabled
    const isLocationEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationEnabled) {
      console.log('📍 Location services are disabled on device');
      return null;
    }

    console.log('📍 Getting current position...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 60000, // Accept cached location up to 1 minute old
    });

    console.log('📍 Got coordinates, getting address...');
    
    // Get address details with error handling
    let address = null;
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      address = addresses[0];
    } catch (reverseGeocodeError) {
      console.log('📍 Could not get address details, using coordinates only');
    }

    const userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: address?.city || address?.subregion || undefined,
      region: address?.region || undefined,
    };

    console.log('✅ Successfully got location:', userLocation);
    return userLocation;
    
  } catch (error: any) {
    console.log('❌ Error getting current location:', error.message || error);
    
    // Handle specific error types
    if (error.message?.includes('Location request failed due to unsatisfied device settings')) {
      console.log('📍 Device location settings need to be enabled (GPS, etc.)');
    } else if (error.message?.includes('timeout')) {
      console.log('📍 Location request timed out');
    } else if (error.message?.includes('denied')) {
      console.log('📍 Location access was denied');
    }
    
    return null;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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
