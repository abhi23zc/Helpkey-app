import { auth, db } from '@/config/firebase';
import { getAuthErrorMessage, getFirstName } from '@/utils/authHelpers';
import { UserData } from '@/types/user';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const authService = {
  // Initialize Google Sign-In
  initializeGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: '897248682595-sda7ul0esps13ert0qrbk34uf49l459s.apps.googleusercontent.com', // Web client ID from Firebase Console
      offlineAccess: true,
      hostedDomain: '', // Optional: specify a domain
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
      accountName: '', // [Android] specifies an account name on the device that should be used
      iosClientId: '897248682595-9dh5u1rccvotv8id4oo126dluchudldv.apps.googleusercontent.com', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    });
  },

  // Google Sign-In
  async signInWithGoogle(): Promise<UserCredential> {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      if (!idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create user document for new Google users
        const userData: UserData = {
          uid: user.uid,
          email: user.email || '',
          fullName: user.displayName || '',
          phoneNumber: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          role: 'user',
          isBanned: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          savedGuests: []
        };

        await setDoc(doc(db, 'users', user.uid), userData);
      }
      
      return userCredential;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'sign_in_cancelled') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'in_progress') {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === 'play_services_not_available') {
        throw new Error('Google Play Services not available');
      }
      
      const errorMessage = getAuthErrorMessage(error.code);
      throw new Error(errorMessage);
    }
  },

  // Sign out from Google
  async signOutGoogle(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  },
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
        phoneNumber: phoneNumber,
        photoURL: '',
        role: 'user',
        isBanned: false,
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
      // Sign out from Google if user signed in with Google
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser) {
        await this.signOutGoogle();
      }
      
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
  },

  // Update user data in Firestore
  async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Update specific user fields
  async updateUserField(uid: string, field: keyof UserData, value: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};
