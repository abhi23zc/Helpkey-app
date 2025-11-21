# Firebase Authentication Setup Guide

## Prerequisites
- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Firebase Authentication enabled (Email/Password provider)
- Firestore Database created

## Setup Steps

### 1. Install Dependencies
The required packages have been installed:
- `firebase` - Firebase SDK
- `@react-native-async-storage/async-storage` - For auth persistence

### 2. Configure Firebase

Update `config/firebase.ts` with your Firebase project credentials:

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

To get these credentials:
1. Go to Firebase Console
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app icon (</>)
6. Copy the config object

### 3. Enable Authentication

In Firebase Console:
1. Go to Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### 4. Set Up Firestore

In Firebase Console:
1. Go to Firestore Database
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location

### 5. Firestore Security Rules

Add these rules to Firestore (for production, make them more restrictive):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Usage

### Register a New User

```typescript
import { authService } from '@/services/authService';

await authService.register(email, password, fullName, phoneNumber);
```

### Login

```typescript
await authService.login(email, password);
```

### Logout

```typescript
await authService.logout();
```

### Get Current User

```typescript
const user = authService.getCurrentUser();
```

### Access Auth State in Components

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, userData, loading, logout } = useAuth();
  
  if (loading) return <Text>Loading...</Text>;
  
  return (
    <View>
      <Text>{userData?.fullName}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## User Data Structure

The app creates user documents in Firestore with this structure:

```typescript
{
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  phoneNumber: string;
  photoURL: string;
  role: string; // 'user' or 'admin'
  isBanned: boolean;
  aadhaarVerified: boolean;
  aadhaarNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  savedGuests: Array;
  aadhaarData?: Object;
}
```

## Files Created

- `config/firebase.ts` - Firebase configuration
- `services/authService.ts` - Authentication service functions
- `context/AuthContext.tsx` - Auth context provider
- `types/user.ts` - TypeScript type definitions
- `app/auth/login.tsx` - Updated with Firebase login
- `app/auth/register.tsx` - Updated with Firebase registration
- `app/_layout.tsx` - Updated with AuthProvider

## Testing

1. Run your app: `npm start`
2. Navigate to the register screen
3. Create a new account
4. Check Firebase Console to see the user created in:
   - Authentication > Users
   - Firestore Database > users collection

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your API key is correct in `config/firebase.ts`

### "Firebase: Error (auth/network-request-failed)"
- Check your internet connection
- Verify Firebase project is active

### "Firebase: Error (auth/email-already-in-use)"
- The email is already registered
- Try logging in instead

### AsyncStorage errors
- Make sure `@react-native-async-storage/async-storage` is properly installed
- Run `npx expo install @react-native-async-storage/async-storage`
