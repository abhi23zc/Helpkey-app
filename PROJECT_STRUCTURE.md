# Project Structure - Firebase Authentication

## 📁 Complete File Structure

```
helpkey/
├── app/
│   ├── (tabs)/
│   │   ├── bookings.tsx
│   │   ├── home.tsx
│   │   ├── profile.tsx          ✨ Updated - Added auth integration
│   │   ├── search.tsx
│   │   └── _layout.tsx
│   ├── auth/
│   │   ├── login.tsx             ✨ Updated - Firebase login
│   │   ├── register.tsx          ✨ Updated - Firebase registration
│   │   └── _layout.tsx
│   ├── hotel/
│   │   └── [id].tsx
│   ├── index.tsx
│   └── _layout.tsx               ✨ Updated - Added AuthProvider
│
├── assets/
│   ├── fonts/
│   └── images/
│
├── components/
│   ├── Button/
│   ├── Card/
│   └── CustomTabBar.tsx
│
├── config/
│   └── firebase.ts               ✨ NEW - Firebase configuration
│
├── constants/
│   └── Colors.ts
│
├── context/
│   └── AuthContext.tsx           ✨ NEW - Auth state management
│
├── services/
│   └── authService.ts            ✨ NEW - Authentication services
│
├── types/
│   └── user.ts                   ✨ NEW - TypeScript type definitions
│
├── utils/
│   └── authHelpers.ts            ✨ NEW - Auth utility functions
│
├── .gitignore
├── app.json
├── bun.lock
├── eslint.config.js
├── expo-env.d.ts
├── package.json
├── package-lock.json
├── tsconfig.json
│
└── Documentation/
    ├── AUTH_IMPLEMENTATION_SUMMARY.md  ✨ NEW - Implementation overview
    ├── FIREBASE_SETUP.md               ✨ NEW - Setup instructions
    ├── QUICK_START.md                  ✨ NEW - Quick start guide
    ├── SETUP_CHECKLIST.md              ✨ NEW - Setup checklist
    └── PROJECT_STRUCTURE.md            ✨ NEW - This file
```

## 📝 File Descriptions

### Core Application Files

#### `app/_layout.tsx`
- Root layout component
- Wraps app with AuthProvider
- Manages navigation stack

#### `app/(tabs)/_layout.tsx`
- Tab navigation layout
- Defines tab screens

#### `app/index.tsx`
- App entry point
- Initial screen

### Authentication Files

#### `app/auth/login.tsx`
- Login screen UI
- Email/password login form
- Firebase authentication integration
- Error handling and validation
- Loading states

#### `app/auth/register.tsx`
- Registration screen UI
- User registration form
- Creates Firebase auth account
- Creates Firestore user document
- Form validation

#### `app/auth/_layout.tsx`
- Auth stack navigation
- Modal presentation

### Tab Screens

#### `app/(tabs)/home.tsx`
- Home screen
- Main dashboard

#### `app/(tabs)/search.tsx`
- Search/explore screen

#### `app/(tabs)/bookings.tsx`
- Bookings history screen

#### `app/(tabs)/profile.tsx`
- User profile screen
- Displays user information
- Logout functionality
- Auth state checking

### Firebase Configuration

#### `config/firebase.ts`
```typescript
- Firebase app initialization
- Auth configuration with AsyncStorage persistence
- Firestore initialization
- Exports: app, auth, db
```

### Services

#### `services/authService.ts`
```typescript
Functions:
- register(email, password, fullName, phoneNumber)
- login(email, password)
- logout()
- getCurrentUser()
- getUserData(uid)

Features:
- User-friendly error messages
- Firestore integration
- Type-safe implementation
```

### Context

#### `context/AuthContext.tsx`
```typescript
Provides:
- user: Current Firebase user
- userData: User data from Firestore
- loading: Loading state
- logout: Logout function

Features:
- Real-time auth state updates
- Automatic user data fetching
- Global state management
```

### Types

#### `types/user.ts`
```typescript
Interfaces:
- User
- UserData
- AadhaarData
- SavedGuest

Purpose:
- Type safety
- IntelliSense support
- Documentation
```

### Utilities

#### `utils/authHelpers.ts`
```typescript
Functions:
- isValidEmail(email)
- isValidPassword(password)
- isValidPhone(phone)
- getAuthErrorMessage(errorCode)
- getFirstName(fullName)
- formatDisplayName(fullName)
- isAdmin(role)
- isUserBanned(isBanned)
- isAadhaarVerified(aadhaarVerified)

Purpose:
- Reusable validation logic
- Error message formatting
- Data transformation
```

## 🔄 Data Flow

### Registration Flow
```
User Input (register.tsx)
    ↓
Validation (authHelpers.ts)
    ↓
authService.register()
    ↓
Firebase Auth (config/firebase.ts)
    ↓
Create User Document (Firestore)
    ↓
AuthContext Updates
    ↓
Navigate to Home
```

### Login Flow
```
User Input (login.tsx)
    ↓
Validation (authHelpers.ts)
    ↓
authService.login()
    ↓
Firebase Auth (config/firebase.ts)
    ↓
Fetch User Data (Firestore)
    ↓
AuthContext Updates
    ↓
Navigate to Home
```

### Auth State Flow
```
App Start
    ↓
AuthProvider Initializes (AuthContext.tsx)
    ↓
onAuthStateChanged Listener
    ↓
Fetch User Data if Authenticated
    ↓
Update Global State
    ↓
Components Re-render
```

## 🎯 Key Features by File

### Authentication Features
- ✅ `login.tsx` - Email/password login
- ✅ `register.tsx` - User registration
- ✅ `authService.ts` - Auth operations
- ✅ `AuthContext.tsx` - State management
- ✅ `firebase.ts` - Firebase setup

### User Management
- ✅ `profile.tsx` - Profile display
- ✅ `authService.ts` - User data fetching
- ✅ `user.ts` - Type definitions

### Validation & Helpers
- ✅ `authHelpers.ts` - Validation functions
- ✅ `authHelpers.ts` - Error formatting
- ✅ `authHelpers.ts` - Data transformation

## 📦 Dependencies

### Production Dependencies
```json
{
  "firebase": "^10.x.x",
  "@react-native-async-storage/async-storage": "^1.x.x",
  "expo": "~54.0.25",
  "expo-router": "~6.0.15",
  "react": "19.1.0",
  "react-native": "0.81.5"
}
```

### Key Libraries
- **firebase** - Firebase SDK for authentication and Firestore
- **@react-native-async-storage/async-storage** - Persistent storage for auth sessions
- **expo-router** - File-based routing
- **react-native-gesture-handler** - Gesture handling

## 🔐 Security Considerations

### Implemented
- ✅ Password minimum length (6 characters)
- ✅ Email validation
- ✅ Secure password storage (Firebase)
- ✅ Session persistence
- ✅ User-friendly error messages
- ✅ Type-safe implementation

### Recommended for Production
- ⚠️ Email verification
- ⚠️ Password reset functionality
- ⚠️ Rate limiting
- ⚠️ App Check
- ⚠️ Firestore security rules
- ⚠️ Environment variables for config

## 📚 Documentation Files

### `FIREBASE_SETUP.md`
- Detailed Firebase setup instructions
- Configuration steps
- Security rules
- Troubleshooting

### `QUICK_START.md`
- Quick start guide
- Usage examples
- Common patterns
- Next steps

### `AUTH_IMPLEMENTATION_SUMMARY.md`
- Implementation overview
- Features list
- User flow diagrams
- Enhancement ideas

### `SETUP_CHECKLIST.md`
- Step-by-step checklist
- Testing procedures
- Production preparation
- Verification commands

### `PROJECT_STRUCTURE.md`
- This file
- Complete file structure
- Data flow diagrams
- Feature mapping

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Update `config/firebase.ts` with your credentials

3. **Enable Firebase Services**
   - Authentication (Email/Password)
   - Firestore Database

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Test Authentication**
   - Register a new user
   - Login with credentials
   - View profile
   - Logout

## 📞 Support

For detailed information, refer to:
- `FIREBASE_SETUP.md` - Setup instructions
- `QUICK_START.md` - Usage guide
- `SETUP_CHECKLIST.md` - Verification checklist
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Feature overview

---

**Status:** ✅ Implementation Complete
**Last Updated:** November 20, 2025
