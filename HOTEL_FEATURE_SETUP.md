# Hotel Feature Setup

## Overview
The home screen now dynamically fetches and displays hotels from Firebase Firestore.

## Files Created/Modified

### New Files:
1. `types/hotel.ts` - Hotel interface definition
2. `services/hotelService.ts` - Firebase hotel data fetching service
3. `scripts/addSampleHotels.ts` - Script to add sample hotel data

### Modified Files:
1. `app/(tabs)/home.tsx` - Updated to fetch and display hotels dynamically

## Features

- **Dynamic Hotel Loading**: Fetches hotels from Firebase Firestore
- **Search Functionality**: Filter hotels by name, location, or city
- **Clean UI**: Displays essential hotel information (name, location, price, rating, stars)
- **Loading States**: Shows loading indicator while fetching data
- **Empty States**: Handles cases when no hotels are found
- **Responsive Cards**: Two card types - large cards for featured hotels and compact cards for list view

## Firebase Collection Structure

Collection: `hotels`

Each hotel document should have:
```typescript
{
  name: string;           // Hotel name
  location: string;       // Specific location/area
  city: string;          // City name
  price: number;         // Price per night in ₹
  rating: number;        // Rating (0-5)
  reviewCount: number;   // Number of reviews
  stars: number;         // Star rating (1-5)
  images: string[];      // Array of image URLs
  amenities: string[];   // Array of amenities
  description?: string;  // Optional description
  roomTypes?: string[];  // Optional room types
  available?: boolean;   // Optional availability status
}
```

## Adding Sample Data

### Option 1: Using Firebase Console (Recommended)

1. Go to your Firebase Console: https://console.firebase.google.com
2. Select your project (helpkey-a8fab)
3. Navigate to Firestore Database
4. Create a new collection called `hotels`
5. For each hotel in `FIREBASE_HOTEL_DATA.json`:
   - Click "Add document"
   - Let Firebase auto-generate the document ID
   - Copy and paste the fields from the JSON file
   - Click "Save"

### Option 2: Import JSON (if available in your Firebase plan)

1. Use the Firebase CLI or Admin SDK to bulk import the `FIREBASE_HOTEL_DATA.json` file
2. Refer to Firebase documentation for bulk import procedures

### Quick Test

After adding at least one hotel document, restart your app and the home screen should display the hotels automatically.

## Usage

The home screen will automatically:
1. Load hotels on mount
2. Display top 5 hotels in the "Recommended for you" section
3. Display remaining hotels in the "More Hotels" section
4. Allow users to search/filter hotels in real-time

## UI Components

### LargeHotelCard
- Displays hotel image, name, location, price, rating, and stars
- Used for featured/recommended hotels
- Horizontal scrollable list

### WideHotelCard
- Compact horizontal card layout
- Shows hotel thumbnail, name, location, price, and rating
- Used for additional hotels list

## Customization

To customize the number of hotels displayed:
- Edit the `fetchRecommendedHotels(10)` parameter in `home.tsx` to change the total number of hotels fetched
- The first 5 are shown in the recommended section, the rest in "More Hotels"

## Notes

- The app uses the user's name from AuthContext (falls back to "Guest")
- Images use fallback URLs if hotel images are not available
- All prices are displayed in Indian Rupees (₹)
