# Quick Start Guide - Firebase Authentication

## What's Been Implemented

✅ Firebase Authentication with Email/Password
✅ User registration with Firestore user profile creation
✅ User login with persistent sessions
✅ User logout functionality
✅ Auth context for global state management
✅ Protected routes and user data access
✅ Profile screen with user information display

## File Structure

```
├── config/
│   └── firebase.ts              # Firebase configuration
├── services/
│   └── authService.ts           # Authentication service functions
├── context/
│   └── AuthContext.tsx          # Auth state management
├── types/
│   └── user.ts                  # TypeScript type definitions
├── app/
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── auth/
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx         # Registration screen
│   └── (tabs)/
│       └── profile.tsx          # Profile screen with logout
```

## Setup Instructions

### 1. Configure Firebase

Edit `config/firebase.ts` and replace the placeholder values with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Enable Firebase Services

In your Firebase Console:
- Enable **Authentication** > Email/Password provider
- Create a **Firestore Database**

### 3. Run the App

```bash
npm start
```

## How to Use

### Register a New User

1. Navigate to the register screen (`/auth/register`)
2. Fill in:
   - Full Name
   - Phone Number
   - Email
   - Password
   - Confirm Password
3. Click "Create Account"
4. User will be created in Firebase Auth and Firestore

### Login

1. Navigate to the login screen (`/auth/login`)
2. Enter email and password
3. Click "Log in"
4. User will be redirected to home screen

### View Profile

1. Navigate to the Profile tab
2. See user information (name, email, phone, role)
3. Click "Logout" to sign out

### Access Auth State in Any Component

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, userData, loading, logout } = useAuth();
  
  if (loading) {
    return <Text>Loading...</Text>;
  }
  
  if (!user) {
    return <Text>Please login</Text>;
  }
  
  return (
    <View>
      <Text>Welcome, {userData?.fullName}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## User Data Structure in Firestore

When a user registers, a document is created in the `users` collection:

```typescript
{
  uid: "user_firebase_uid",
  email: "user@example.com",
  fullName: "John Doe",
  firstName: "John",
  phoneNumber: "+1234567890",
  photoURL: "",
  role: "user",
  isBanned: false,
  aadhaarVerified: false,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  savedGuests: []
}
```

## Features

### Authentication Service (`services/authService.ts`)

- `register(email, password, fullName, phoneNumber)` - Register new user
- `login(email, password)` - Login existing user
- `logout()` - Logout current user
- `getCurrentUser()` - Get current Firebase user
- `getUserData(uid)` - Get user data from Firestore

### Auth Context (`context/AuthContext.tsx`)

Provides global access to:
- `user` - Current Firebase user object
- `userData` - User data from Firestore
- `loading` - Loading state
- `logout()` - Logout function

### Screens

**Login Screen** (`app/auth/login.tsx`)
- Email/password login
- Password visibility toggle
- Remember me checkbox
- Error handling with alerts
- Loading state

**Register Screen** (`app/auth/register.tsx`)
- Full name, phone, email, password fields
- Password confirmation
- Validation (matching passwords, minimum length)
- Error handling with alerts
- Loading state

**Profile Screen** (`app/(tabs)/profile.tsx`)
- Display user information
- Logout functionality
- Login prompt for unauthenticated users

## Next Steps

### Add Aadhaar Verification

The user schema supports Aadhaar verification. You can extend the auth service:

```typescript
async updateAadhaarData(uid: string, aadhaarData: AadhaarData) {
  await updateDoc(doc(db, 'users', uid), {
    aadhaarData,
    aadhaarVerified: true,
    aadhaarNumber: aadhaarData.aadhaarNumber,
    updatedAt: serverTimestamp()
  });
}
```

### Add Password Reset

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

async resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
```

### Add Email Verification

```typescript
import { sendEmailVerification } from 'firebase/auth';

async sendVerification() {
  const user = auth.currentUser;
  if (user) {
    await sendEmailVerification(user);
  }
}
```

### Add Social Authentication

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

async loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}
```

## Troubleshooting

### "Cannot find module '@/config/firebase'"
- Make sure `tsconfig.json` has the path alias configured
- Restart your development server

### "Firebase: Error (auth/invalid-api-key)"
- Check your Firebase config in `config/firebase.ts`
- Verify the API key is correct

### "Firebase: Error (auth/network-request-failed)"
- Check internet connection
- Verify Firebase project is active

### AsyncStorage errors on iOS
- Run: `cd ios && pod install && cd ..`
- Rebuild the app

## Security Notes

⚠️ **Important**: Before deploying to production:

1. Update Firestore security rules
2. Enable App Check
3. Set up proper error logging
4. Implement rate limiting
5. Add email verification requirement
6. Use environment variables for Firebase config

## Support

For detailed Firebase documentation:
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
