# Quick Start: Adding Hotels to Your App

## Step-by-Step Guide

### 1. Open Firebase Console
Visit: https://console.firebase.google.com/project/helpkey-a8fab/firestore

### 2. Create Hotels Collection
- Click "Start collection"
- Collection ID: `hotels`
- Click "Next"

### 3. Add Your First Hotel
Use these values for a quick test:

**Document ID**: (Auto-ID)

**Fields**:
```
name: "Grand Horizon Hotel"
location: "Keshavpuram"
city: "Kanpur"
price: 500
rating: 4.2
reviewCount: 48
stars: 3
images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=60"]
amenities: ["Free WiFi", "Room Service", "Airport Shuttle"]
available: true
```

**Field Types**:
- name: string
- location: string
- city: string
- price: number
- rating: number
- reviewCount: number
- stars: number
- images: array (of strings)
- amenities: array (of strings)
- available: boolean

### 4. Add More Hotels (Optional)
Copy data from `FIREBASE_HOTEL_DATA.json` and add more hotels following the same pattern.

### 5. Test the App
```bash
npm start
# or
expo start
```

Navigate to the Home tab and you should see your hotels!

## Troubleshooting

**Hotels not showing?**
- Check Firebase Console to ensure hotels collection exists
- Verify at least one hotel document is added
- Check the app console for any errors
- Ensure Firebase config in `config/firebase.ts` is correct

**Search not working?**
- Make sure hotel documents have `name`, `location`, and `city` fields
- All fields should be strings

**Images not loading?**
- Verify image URLs are valid and accessible
- Check if images array is properly formatted

## What You'll See

- **Recommended Section**: Top 5 hotels sorted by rating
- **More Hotels Section**: Remaining hotels in a list view
- **Search Bar**: Filter hotels by name, location, or city
- **Hotel Cards**: Display name, location, price, rating, and stars

## Need Help?

Refer to:
- `HOTEL_FEATURE_SETUP.md` - Detailed documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `FIREBASE_HOTEL_DATA.json` - Sample data
