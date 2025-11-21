# Helpkey - Hotel Booking App 🏨

This is an [Expo](https://expo.dev) React Native app with Firebase Authentication integration.

## 🔥 Firebase Authentication Implemented

This app now includes a complete Firebase authentication system with:
- ✅ User registration with email/password
- ✅ User login with persistent sessions
- ✅ User profile management
- ✅ Firestore user data storage
- ✅ Global auth state management
- ✅ Logout functionality

### 📚 Documentation

Before starting, please read these guides:

1. **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Complete setup checklist
2. **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase configuration
3. **[QUICK_START.md](./QUICK_START.md)** - Quick start guide
4. **[AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)** - Implementation overview
5. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Project structure

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

**Important:** You must configure Firebase before running the app.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore Database
4. Copy your Firebase config
5. Update `config/firebase.ts` with your credentials:

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

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

### 3. Start the app

```bash
npm start
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## 📱 Features

- **Authentication**
  - Email/password registration
  - Email/password login
  - Persistent sessions
  - User profile display
  - Logout functionality

- **User Management**
  - Firestore user data storage
  - User profile with name, email, phone
  - Role-based access (user/admin)
  - Aadhaar verification support

- **UI/UX**
  - Modern gradient designs
  - Loading states
  - Error handling
  - Form validation
  - Modal animations

## 🏗️ Project Structure

```
├── app/
│   ├── (tabs)/          # Tab navigation screens
│   ├── auth/            # Authentication screens
│   └── _layout.tsx      # Root layout with AuthProvider
├── config/
│   └── firebase.ts      # Firebase configuration
├── services/
│   └── authService.ts   # Authentication services
├── context/
│   └── AuthContext.tsx  # Auth state management
├── types/
│   └── user.ts          # TypeScript types
└── utils/
    └── authHelpers.ts   # Auth utilities
```

## 🔐 Authentication Usage

### In any component:

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, userData, loading, logout } = useAuth();
  
  if (loading) return <Text>Loading...</Text>;
  if (!user) return <Text>Please login</Text>;
  
  return (
    <View>
      <Text>Welcome, {userData?.fullName}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## 📖 Development

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## 🧪 Testing

1. **Register a new user**
   - Navigate to `/auth/register`
   - Fill in all fields
   - Click "Create Account"

2. **Login**
   - Navigate to `/auth/login`
   - Enter credentials
   - Click "Log in"

3. **View Profile**
   - Navigate to Profile tab
   - See user information
   - Test logout

4. **Verify in Firebase Console**
   - Check Authentication > Users
   - Check Firestore > users collection

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module '@/config/firebase'"**
- Restart development server: `npx expo start -c`

**"Firebase: Error (auth/invalid-api-key)"**
- Check Firebase config in `config/firebase.ts`

**"Firebase: Error (auth/network-request-failed)"**
- Check internet connection
- Verify Firebase project is active

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for more troubleshooting tips.

## 📚 Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

## 🤝 Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

**Status:** ✅ Firebase Authentication Implemented
**Last Updated:** November 20, 2025
