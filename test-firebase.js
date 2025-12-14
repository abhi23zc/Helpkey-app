// Simple Firebase connection test
import { collection, getDocs } from 'firebase/firestore';
import { db } from './config/firebase.ts';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    const hotelsRef = collection(db, 'hotels');
    const snapshot = await getDocs(hotelsRef);
    console.log(`Firebase connection successful! Found ${snapshot.docs.length} hotels`);
    
    // Log first hotel for debugging
    if (snapshot.docs.length > 0) {
      const firstHotel = snapshot.docs[0].data();
      console.log('First hotel:', {
        id: snapshot.docs[0].id,
        name: firstHotel.name,
        approved: firstHotel.approved,
        status: firstHotel.status
      });
    }
    
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};