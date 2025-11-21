# Image Loading Fixes

## Issues Identified

Based on your Firebase schema, there were several issues with image loading:

### 1. **Room Schema Mismatch**
Your Firebase rooms have:
- `images` (array) - not `image` (single string)
- `hourlyRates` (array of objects) - not `hourlyPrice` (single number)

### 2. **Missing Hotel Images**
Some hotels might not have images in the hotel document, but their rooms do have images.

### 3. **AVIF Format**
Your images are in `.avif` format from Cloudinary, which React Native Image component should support but might have issues with.

## Fixes Applied

### 1. **Room Image Extraction**
```typescript
// Before
image: roomData.images?.[0] || null

// After
image: getSafeArray(roomData.images, [])[0] || null
```
Now properly extracts the first image from the images array.

### 2. **Hourly Price Extraction**
```typescript
// Extract from hourlyRates array
let hourlyPrice = 0;
if (Array.isArray(roomData.hourlyRates) && roomData.hourlyRates.length > 0) {
  hourlyPrice = getSafeNumber(roomData.hourlyRates[0]?.price, 0);
} else {
  hourlyPrice = getSafeNumber(roomData.hourlyPrice, 0);
}
```
Now handles both `hourlyRates` array and legacy `hourlyPrice` field.

### 3. **Hotel Image Fallback**
```typescript
// If hotel has no images, use first room's image
if (hotelImages.length === 0 && rooms.length > 0) {
  const roomWithImage = rooms.find(room => room.image);
  if (roomWithImage && roomWithImage.image) {
    primaryImage = roomWithImage.image;
    hotelImages.push(roomWithImage.image);
  }
}
```
Hotels without images now automatically use their first room's image.

### 4. **Image Error Handling**
```typescript
const [imageError, setImageError] = useState(false);
const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
const imageUri = imageError ? fallbackImage : (hotel.image || fallbackImage);

<Image
  source={{ uri: imageUri }}
  onError={(error) => {
    console.log('Image load error for hotel:', hotel.name, 'URL:', hotel.image);
    setImageError(true);
  }}
/>
```
If an image fails to load, it automatically falls back to a default image.

### 5. **Debug Logging**
Added console logs to help debug:
- Total hotels fetched
- Approved hotels count
- Each hotel's image status
- Image load errors with URLs

## Your Firebase Schema

Based on your example, your rooms have:

```javascript
{
  amenities: [],
  beds: "2",
  bookingType: "both",
  capacity: 0,
  hotelAdmin: "0TgS3HwbSzMsyCOJQBf9sGB75it1",
  hotelId: "las8ZCthA1RuH0Za04MJ",
  hotelName: "COSMOZIN",
  hourlyRates: [
    { hours: 1, price: 100 },
    { hours: 3, price: 200 },
    { hours: 5, price: 300 }
  ],
  images: [
    "https://res.cloudinary.com/dl2cxd5ur/image/upload/v1759297926/images/od4jy72bwra5jfuvpaki.avif",
    "https://res.cloudinary.com/dl2cxd5ur/image/upload/v1759297928/images/hrootuhctf8haxkayjbx.avif",
    "https://res.cloudinary.com/dl2cxd5ur/image/upload/v1759297930/images/x4mghhmtvpkm2j3oc0sy.avif"
  ],
  price: 1000,
  roomNumber: "102",
  roomType: "Luxury",
  size: "1200",
  status: "Available"
}
```

## Testing

To verify the fixes:

1. **Check Console Logs**:
   - Look for "Fetching X hotels from Firebase..."
   - Look for "Filtered to X approved hotels with rooms"
   - Look for "Hotel: [name], Image: Yes/No, Rooms: X"
   - Look for any "Image load error" messages

2. **Check Image Loading**:
   - Hotels should now display room images if hotel has no images
   - Failed images should fallback to Unsplash placeholder
   - AVIF images from Cloudinary should load correctly

3. **Check Hourly Pricing**:
   - Hourly hotels should show the first hourly rate price
   - Price should display correctly in hotel cards

## Potential Issues

### AVIF Format Support
If images still don't load, it might be because:
1. React Native Image component doesn't support AVIF on your platform
2. Cloudinary URLs need authentication
3. Network/CORS issues

### Solutions:
1. **Convert to WebP/JPEG**: Update Cloudinary URLs to serve WebP or JPEG
   ```
   // Change .avif to .webp or .jpg
   https://res.cloudinary.com/.../image.avif
   // to
   https://res.cloudinary.com/.../image.webp
   ```

2. **Use Cloudinary Transformations**:
   ```
   https://res.cloudinary.com/dl2cxd5ur/image/upload/f_auto,q_auto/v1759297926/images/od4jy72bwra5jfuvpaki
   ```
   The `f_auto` parameter automatically serves the best format for the device.

3. **Check Expo Image**: Consider using `expo-image` instead of React Native's Image:
   ```bash
   npx expo install expo-image
   ```
   Expo Image has better format support including AVIF.

## Next Steps

1. Run the app and check console logs
2. If images still don't load, check the console for error messages
3. Try converting one image URL to .webp or .jpg to test
4. Consider using Expo Image for better format support

## Example Cloudinary URL Transformation

```typescript
// In hotelService.ts, add a helper function
const transformCloudinaryUrl = (url: string): string => {
  if (url.includes('cloudinary.com')) {
    // Replace .avif with .webp or add f_auto transformation
    return url.replace('/upload/', '/upload/f_auto,q_auto/').replace('.avif', '');
  }
  return url;
};

// Use it when extracting images
image: transformCloudinaryUrl(getSafeArray(roomData.images, [])[0] || '')
```
