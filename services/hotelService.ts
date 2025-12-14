import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Hotel, Room } from '../types/hotel';

// Helper functions
const getSafeString = (value: any, defaultValue: string): string => {
  return typeof value === 'string' ? value : defaultValue;
};

const getSafeNumber = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const getSafeArray = (value: any, defaultValue: any[]): any[] => {
  return Array.isArray(value) ? value : defaultValue;
};

const getSafeImage = (images: any): string => {
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
};

const getSafePolicies = (policies: any): any => {
  return policies && typeof policies === 'object' ? policies : {};
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

export const fetchHotelsWithRooms = async (): Promise<Hotel[]> => {
  try {
    const hotelsCollectionRef = collection(db, 'hotels');
    const data = await getDocs(hotelsCollectionRef);
    
    console.log(`Fetching ${data.docs.length} hotels from Firebase...`);
    
    const fetchedHotels: Hotel[] = await Promise.all(
      data.docs.map(async (doc) => {
        const d = doc.data() as any;
        
        // Fetch rooms for this hotel
        const roomsQuery = query(
          collection(db, 'rooms'),
          where('hotelId', '==', doc.id)
        );
        const roomsSnapshot = await getDocs(roomsQuery);
        const rooms: Room[] = roomsSnapshot.docs.map((roomDoc) => {
          const roomData = roomDoc.data();
          
          // Extract hourly price from hourlyRates array
          let hourlyPrice = 0;
          if (Array.isArray(roomData.hourlyRates) && roomData.hourlyRates.length > 0) {
            // Get the first hourly rate option
            hourlyPrice = getSafeNumber(roomData.hourlyRates[0]?.price, 0);
          } else {
            hourlyPrice = getSafeNumber(roomData.hourlyPrice, 0);
          }
          
          return {
            id: roomDoc.id,
            type: getSafeString(roomData.roomType, 'Standard Room'),
            price: getSafeNumber(roomData.price, 0),
            hourlyPrice: hourlyPrice,
            bookingType: roomData.bookingType || 'nightly',
            size: getSafeString(roomData.size, ''),
            beds: getSafeString(roomData.beds, ''),
            capacity: getSafeNumber(roomData.capacity, 2),
            image: getSafeArray(roomData.images, [])[0] || null,
            amenities: getSafeArray(roomData.amenities, []),
            originalPrice: getSafeNumber(
              roomData.originalPrice,
              roomData.price || 0
            ),
          };
        });

        // Calculate minimum room prices
        const roomPrices = rooms
          .map((room) => {
            if (room.bookingType === 'hourly' && room.hourlyPrice) {
              return room.hourlyPrice;
            }
            return room.price;
          })
          .filter((price) => price > 0);

        const roomOriginalPrices = rooms
          .map((room) => room.originalPrice || room.price)
          .filter((price) => price > 0);

        const minPrice =
          roomPrices.length > 0
            ? Math.min(...roomPrices)
            : getSafeNumber(d.price, 0);
        const minOriginalPrice =
          roomOriginalPrices.length > 0
            ? Math.min(...roomOriginalPrices)
            : getSafeNumber(d.originalPrice, d.price || 0);

        // Get hotel images, fallback to room images if hotel has no images
        const hotelImages = getSafeArray(d.images, []);
        let primaryImage = getSafeImage(d.images);
        
        // If hotel has no images, use first room's image
        if (hotelImages.length === 0 && rooms.length > 0) {
          const roomWithImage = rooms.find(room => room.image);
          if (roomWithImage && roomWithImage.image) {
            primaryImage = roomWithImage.image;
            hotelImages.push(roomWithImage.image);
          }
        }

        return {
          id: doc.id,
          name: getSafeString(d.name, 'Unnamed Hotel'),
          location: getSafeString(d.location, 'Unknown Location'),
          address: getSafeString(d.address, 'No address provided'),
          city: getSafeString(d.city, ''),
          price: minPrice,
          originalPrice: minOriginalPrice,
          rating: getSafeNumber(d.rating, 4.2),
          reviews: getSafeNumber(d.reviews, Math.floor(Math.random() * 100) + 1),
          reviewCount: getSafeNumber(d.reviews, Math.floor(Math.random() * 100) + 1),
          stars: getSafeNumber(d.stars, 3),
          image: primaryImage,
          images: hotelImages,
          videos: getSafeArray(d.videos, []),
          amenities: getSafeArray(d.amenities, ['Free WiFi']),
          approved: d.approved === true,
          status: getSafeString(d.status, 'inactive'),
          description: getSafeString(d.description, 'No description available.'),
          email: getSafeString(d.email, ''),
          phone: getSafeString(d.phone, ''),
          rooms: rooms,
          policies: getSafePolicies(d.policies),
          latitude: d.latitude || d.lat,
          longitude: d.longitude || d.lng,
        };
      })
    );

    // Filter approved hotels with rooms
    const approvedHotels = fetchedHotels.filter(
      (hotel) =>
        hotel.approved === true &&
        hotel.status === 'active' &&
        hotel.rooms.length > 0
    );

    console.log(`Filtered to ${approvedHotels.length} approved hotels with rooms`);
    
    // Log image info for debugging
    approvedHotels.forEach(hotel => {
      console.log(`Hotel: ${hotel.name}, Image: ${hotel.image ? 'Yes' : 'No'}, Rooms: ${hotel.rooms.length}`);
    });

    return approvedHotels;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
};
