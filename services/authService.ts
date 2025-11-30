import { auth, db } from '@/config/firebase';
import { getAuthErrorMessage, getFirstName } from '@/utils/authHelpers';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  phoneNumber: string;
  photoURL: string;
  role: string;
  isBanned: boolean;
  aadhaarVerified: boolean;
  aadhaarNumber?: string;
  createdAt: any;
  updatedAt: any;
  savedGuests?: any[];
  aadhaarData?: any;
}

export const authService = {
  // Register new user
  async register(email: string, password: string, fullName: string, phoneNumber: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData: UserData = {
        uid: user.uid,
        email: email,
        fullName: fullName,
        firstName: getFirstName(fullName),
        phoneNumber: phoneNumber,
        photoURL: '',
        role: 'user',
        isBanned: false,
        aadhaarVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        savedGuests: []
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      return userCredential;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      throw new Error(errorMessage);
    }
  },

  // Login user
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.log(error)
      throw new Error(errorMessage);
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Get user data from Firestore
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};
