import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function DebugInfo() {
  const [firebaseStatus, setFirebaseStatus] = useState('Testing...');
  const [hotelCount, setHotelCount] = useState(0);

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      console.log('Testing Firebase connection...');
      const hotelsRef = collection(db, 'hotels');
      const snapshot = await getDocs(hotelsRef);
      
      setHotelCount(snapshot.docs.length);
      setFirebaseStatus('Connected');
      
      console.log(`Firebase connected! Found ${snapshot.docs.length} hotels`);
      
      // Log some hotel data for debugging
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`Hotel ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          approved: data.approved,
          status: data.status,
          hasImages: Array.isArray(data.images) && data.images.length > 0
        });
      });
      
    } catch (error) {
      console.error('Firebase test failed:', error);
      setFirebaseStatus(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Info</Text>
      <Text style={styles.text}>Firebase: {firebaseStatus}</Text>
      <Text style={styles.text}>Hotels: {hotelCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
});