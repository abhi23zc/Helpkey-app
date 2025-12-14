// Run this script to add sample hotels to Firebase
// Usage: npx ts-node scripts/addSampleHotels.ts

import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

const sampleHotels = [
  {
    name: 'Grand Horizon Hotel',
    location: 'Keshavpuram',
    city: 'Kanpur',
    price: 500,
    rating: 4.2,
    reviewCount: 48,
    stars: 3,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=60'
    ],
    amenities: ['Free WiFi', 'Room Service', 'Airport Shuttle'],
    description: 'Comfortable hotel with modern amenities',
    roomTypes: ['Standard', 'Deluxe'],
    available: true
  },
  {
    name: 'CityLights Business Hotel',
    location: 'Swaroop Nagar',
    city: 'Kanpur',
    price: 500,
    rating: 4.2,
    reviewCount: 74,
    stars: 3,
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=60'
    ],
    amenities: ['Free WiFi', 'Swimming Pool', 'Gym'],
    available: true
  },
  {
    name: 'COSMOZIN',
    location: 'Naubasta Barra',
    city: 'Kanpur',
    price: 1000,
    rating: 4.2,
    reviewCount: 54,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?auto=format&fit=crop&w=600&q=60'
    ],
    amenities: ['Free WiFi', 'Swimming Pool', 'Air Conditioning'],
    available: true
  },
  {
    name: 'Grand Luxury Resort',
    location: 'Bithoor Road',
    city: 'Kanpur',
    price: 1200,
    rating: 4.2,
    reviewCount: 17,
    stars: 4,
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=600&q=60'
    ],
    amenities: ['Free WiFi', 'Restaurant', 'Spa'],
    available: true
  },
  {
    name: 'Emerald View Hotel',
    location: 'Civil Lines',
    city: 'Kanpur',
    price: 800,
    rating: 4.5,
    reviewCount: 92,
    stars: 4,
    images: [
      'https://images.unsplash.com/photo-1600596542815-5051161a8d82?auto=format&fit=crop&w=600&q=60'
    ],
    amenities: ['Free WiFi', 'Parking', 'Restaurant'],
    available: true
  }
];

async function addSampleHotels() {
  try {
    const hotelsRef = collection(db, 'hotels');
    
    for (const hotel of sampleHotels) {
      const docRef = await addDoc(hotelsRef, hotel);
      console.log(`Added hotel: ${hotel.name} with ID: ${docRef.id}`);
    }
    
    console.log('All sample hotels added successfully!');
  } catch (error) {
    console.error('Error adding sample hotels:', error);
  }
}

addSampleHotels();
