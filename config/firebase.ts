import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
//@ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config
const firebaseConfig = {
   apiKey: "AIzaSyCSZpzKgLLm2dUj8QEcDuc8NYI0GGy78uw",
  authDomain: "helpkey-a8fab.firebaseapp.com",
  projectId: "helpkey-a8fab",
  storageBucket: "helpkey-a8fab.firebasestorage.app",
  messagingSenderId: "897248682595",
  appId: "1:897248682595:web:d5ea70e45f274317804e56",
  measurementId: "G-HS1981H7MD"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

