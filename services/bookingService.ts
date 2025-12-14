import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

export interface BookingData {
  bookingType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  hotelId: string;
  roomId: string;
  userId: string;
  userEmail: string;
  hourlyDuration?: number;
  hotelDetails: {
    hotelId: string;
    name: string;
    location: string;
    image: string;
  };
  roomDetails: {
    roomId: string;
    type: string;
    roomNumber: string | null;
    price: number;
    image: string;
    beds: string;
    size: string;
  };
  guestInfo: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    aadhaarVerified: boolean;
    aadhaarData: any;
    specialRequests: string;
  }>;
  guestVerifications: Array<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    aadhaarNumber: string;
    verified: boolean;
    verificationDetails: any;
  }>;
  unitPrice: number;
  totalPrice: number;
  taxesAndFees: number;
  totalAmount: number;
  paymentInfo: {
    method: string;
    status: string;
    orderId: string | null;
    paymentId: string | null;
    signature: string | null;
  };
  status: string;
  reference: string;
  customerPreferences: any;
  customerVerification: any;
  hotelAdmin?: string;
}

export const createBooking = async (bookingData: BookingData): Promise<string> => {
  try {
    // Use hotelAdmin from bookingData if provided, otherwise fetch from hotel document
    let hotelAdmin = bookingData.hotelAdmin || '';
    
    if (!hotelAdmin) {
      const hotelDoc = await getDoc(doc(db, 'hotels', bookingData.hotelId));
      hotelAdmin = hotelDoc.exists() ? (hotelDoc.data()?.hotelAdmin || hotelDoc.data()?.userId || '') : '';
    }

    console.log('💾 Saving to Firebase with hotelAdmin:', hotelAdmin);

    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      hotelAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    return bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const getBookingById = async (bookingId: string) => {
  try {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

export const updateBookingStatus = async (
  bookingId: string,
  status: string,
  paymentInfo?: any
) => {
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (paymentInfo) {
      updateData.paymentInfo = paymentInfo;
    }

    await updateDoc(doc(db, 'bookings', bookingId), updateData);
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};
