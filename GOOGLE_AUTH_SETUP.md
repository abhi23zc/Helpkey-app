# Google Authentication Setup Guide

## 🚀 Implementation Status
✅ **COMPLETED:**
- Google Sign-In package installed (`@react-native-google-signin/google-signin`)
- AuthService extended with Google authentication methods
- Login and Register screens updated with functional Google buttons
- Error handling for Google-specific errors
- App.json configured for Google Sign-In plugin
- TypeScript types properly configured

## 🔧 **REQUIRED CONFIGURATION STEPS**

### 1. Firebase Console Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project: `helpkey-a8fab`**
3. **Navigate to Authentication > Sign-in method**
4. **Enable Google Sign-In:**
   - Click on "Google" provider
   - Toggle "Enable"
   - Set support email
   - Save configuration

### 2. Get Client IDs

1. **In Firebase Console, go to Project Settings**
2. **Scroll down to "Your apps" section**
3. **For each platform, note down the client IDs:**

   **Android:**
   - Download the updated `google-services.json`
   - Place it in your project root directory
   - Note the `client_id` from the file

   **iOS:**
   - Download the updated `GoogleService-Info.plist`
   - Place it in your project root directory
   - Note the `CLIENT_ID` from the file

   **Web:**
   - Copy the Web client ID (ends with `.apps.googleusercontent.com`)

### 3. Update Configuration Files

**Update `app.json`:**
```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

**Update `services/authService.ts`:**
```typescript
initializeGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    offlineAccess: true,
  });
},
```

### 4. Platform-Specific Setup

**Android:**
1. Ensure `google-services.json` is in project root
2. The file should be automatically detected by Expo

**iOS:**
1. Ensure `GoogleService-Info.plist` is in project root
2. Update the `iosUrlScheme` in `app.json` with your iOS client ID

### 5. Testing

1. **Build and test on device/simulator:**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

2. **Test Google Sign-In flow:**
   - Tap the Google (Chrome) icon on login/register screens
   - Complete Google authentication
   - Verify user is created in Firestore
   - Test logout functionality

## 🔍 **Current Configuration Placeholders**

**Files that need your actual client IDs:**

1. **`app.json` (line ~47):**
   ```json
   "iosUrlScheme": "com.googleusercontent.apps.897248682595-YOUR_IOS_CLIENT_ID"
   ```
   Replace `YOUR_IOS_CLIENT_ID` with actual iOS client ID

2. **`services/authService.ts` (line ~15):**
   ```typescript
   webClientId: '897248682595-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
   ```
   Replace `YOUR_WEB_CLIENT_ID` with actual web client ID

## 🎯 **How It Works**

1. **User taps Google sign-in button**
2. **Google Sign-In SDK opens authentication flow**
3. **User completes Google authentication**
4. **App receives ID token from Google**
5. **Firebase exchanges token for Firebase user**
6. **App creates/updates user document in Firestore**
7. **User is signed in and redirected to home screen**

## 🛠 **Troubleshooting**

**Common Issues:**
- **"Developer Error"**: Wrong client ID configuration
- **"Network Error"**: Check internet connection
- **"Play Services Not Available"**: Android emulator needs Google Play Services
- **"Sign-in cancelled"**: User cancelled the flow (normal behavior)

**Debug Steps:**
1. Check Firebase Console for authentication logs
2. Verify client IDs match exactly
3. Ensure `google-services.json` and `GoogleService-Info.plist` are up to date
4. Test on physical device if emulator issues persist

## 📱 **UI Features Added**

- **Loading states** for Google sign-in buttons
- **Error handling** with user-friendly messages
- **Consistent styling** with existing auth screens
- **Automatic user creation** in Firestore for new Google users
- **Proper logout** handling for Google users

## 🔄 **Next Steps**

1. Get your client IDs from Firebase Console
2. Update the placeholder values in the configuration files
3. Add the Google services files to your project
4. Test the implementation
5. Deploy and enjoy Google authentication! 🎉