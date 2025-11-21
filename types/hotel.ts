export interface HourlyRate {
  hours: number;
  price: number;
}

export interface Room {
  id: string;
  type: string; // keeping for compatibility, mapped from roomType
  roomType: string;
  price: number;
  hourlyPrice: number; // keeping for compatibility
  hourlyRates: HourlyRate[];
  bookingType: 'hourly' | 'nightly' | 'both';
  size: string;
  beds: string;
  capacity: number;
  image: string | null; // keeping for compatibility, mapped from images[0]
  images: string[];
  amenities: string[];
  originalPrice: number;
  roomNumber: string;
  status: string;
}

export interface HotelPolicies {
  checkIn?: string;
  checkOut?: string;
  cancellation?: string;
  [key: string]: any;
}

export interface Review {
  id: string;
  hotelId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt?: any;
  userEmail?: string
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string;
  city?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  reviewCount?: number;
  stars: number;
  image: string;
  images: string[];
  videos?: string[];
  amenities: string[];
  description: string;
  email?: string;
  phone?: string;
  approved: boolean;
  status: string;
  rooms: Room[];
  policies?: HotelPolicies;
  latitude?: number;
  longitude?: number;
  distance?: number;
  available?: boolean;
}
