# Firebase Authentication Setup Checklist

Use this checklist to ensure your Firebase authentication is properly configured.

## ☑️ Pre-Setup

- [ ] Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- [ ] Node.js and npm/yarn installed
- [ ] Expo CLI installed
- [ ] Project dependencies installed (`npm install`)

## ☑️ Firebase Console Setup

### 1. Authentication
- [ ] Go to Firebase Console > Authentication
- [ ] Click "Get Started"
- [ ] Enable "Email/Password" sign-in method
- [ ] (Optional) Enable "Email link (passwordless sign-in)"

### 2. Firestore Database
- [ ] Go to Firebase Console > Firestore Database
- [ ] Click "Create Database"
- [ ] Choose "Start in test mode" (for development)
- [ ] Select a location (choose closest to your users)
- [ ] Wait for database to be created

### 3. Firebase Config
- [ ] Go to Project Settings (gear icon)
- [ ] Scroll to "Your apps" section
- [ ] Click web icon (</>)
- [ ] Register your app
- [ ] Copy the firebaseConfig object

### 4. Security Rules (Important!)
- [ ] Go to Firestore Database > Rules
- [ ] Update rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read
      allow read: if request.auth != null;
      // Only the user can write their own data
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- [ ] Click "Publish"

## ☑️ Code Configuration

### 1. Update Firebase Config
- [ ] Open `config/firebase.ts`
- [ ] Replace placeholder values with your Firebase config:
  - [ ] apiKey
  - [ ] authDomain
  - [ ] projectId
  - [ ] storageBucket
  - [ ] messagingSenderId
  - [ ] appId

### 2. Verify Dependencies
- [ ] Check `package.json` includes:
  - [ ] `firebase`
  - [ ] `@react-native-async-storage/async-storage`
- [ ] Run `npm install` if needed

### 3. Test Import Paths
- [ ] Verify `tsconfig.json` has path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## ☑️ Testing

### 1. Start Development Server
- [ ] Run `npm start` or `expo start`
- [ ] Scan QR code with Expo Go app
- [ ] Wait for app to load

### 2. Test Registration
- [ ] Navigate to Register screen
- [ ] Fill in all fields:
  - [ ] Full Name
  - [ ] Phone Number
  - [ ] Email
  - [ ] Password
  - [ ] Confirm Password
- [ ] Click "Create Account"
- [ ] Check for success message
- [ ] Verify redirect to home screen

### 3. Verify in Firebase Console
- [ ] Go to Authentication > Users
- [ ] Confirm new user appears
- [ ] Go to Firestore Database > users collection
- [ ] Confirm user document created with correct fields

### 4. Test Login
- [ ] Logout from app
- [ ] Navigate to Login screen
- [ ] Enter registered email and password
- [ ] Click "Log in"
- [ ] Verify successful login
- [ ] Check redirect to home screen

### 5. Test Profile Screen
- [ ] Navigate to Profile tab
- [ ] Verify user information displays:
  - [ ] Name
  - [ ] Email
  - [ ] Phone
  - [ ] Role
- [ ] Click "Logout"
- [ ] Confirm logout dialog appears
- [ ] Confirm logout successful

### 6. Test Error Handling
- [ ] Try registering with existing email
- [ ] Try logging in with wrong password
- [ ] Try registering with weak password
- [ ] Try registering with mismatched passwords
- [ ] Verify error messages are user-friendly

### 7. Test Persistence
- [ ] Login to app
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify user is still logged in
- [ ] Verify user data loads correctly

## ☑️ Production Preparation

### 1. Security
- [ ] Update Firestore security rules (see above)
- [ ] Enable App Check in Firebase Console
- [ ] Add rate limiting for auth endpoints
- [ ] Implement email verification requirement
- [ ] Add CAPTCHA for registration (optional)

### 2. Environment Variables
- [ ] Move Firebase config to environment variables
- [ ] Create `.env` file (add to .gitignore)
- [ ] Use `expo-constants` or similar for env vars
- [ ] Never commit Firebase credentials to git

### 3. Error Logging
- [ ] Set up error tracking (Sentry, Crashlytics)
- [ ] Add logging for auth failures
- [ ] Monitor authentication metrics

### 4. User Experience
- [ ] Add email verification flow
- [ ] Add password reset functionality
- [ ] Add "Forgot Password" link
- [ ] Implement loading skeletons
- [ ] Add success animations

### 5. Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test with slow network
- [ ] Test offline behavior
- [ ] Test with various screen sizes

## ☑️ Optional Enhancements

- [ ] Add Google Sign-In
- [ ] Add Facebook Sign-In
- [ ] Add Apple Sign-In
- [ ] Add phone number authentication
- [ ] Add biometric authentication
- [ ] Add two-factor authentication
- [ ] Add profile photo upload
- [ ] Add user settings screen
- [ ] Add account deletion
- [ ] Add data export

## 🎯 Quick Verification Commands

```bash
# Check if dependencies are installed
npm list firebase @react-native-async-storage/async-storage

# Start development server
npm start

# Clear cache if needed
npx expo start -c

# Check for TypeScript errors
npx tsc --noEmit
```

## 📞 Support

If you encounter issues:

1. Check `FIREBASE_SETUP.md` for detailed instructions
2. Check `QUICK_START.md` for usage examples
3. Check `AUTH_IMPLEMENTATION_SUMMARY.md` for overview
4. Review Firebase Console for errors
5. Check browser console for error messages
6. Verify all checklist items are completed

## ✅ Completion

Once all items are checked:
- ✨ Your Firebase authentication is fully configured
- 🚀 Your app is ready for user registration and login
- 🔐 User data is securely stored in Firestore
- 📱 Users can access their profile and logout
- 🎉 You're ready to build more features!

---

**Last Updated:** November 20, 2025
**Status:** Implementation Complete ✅
