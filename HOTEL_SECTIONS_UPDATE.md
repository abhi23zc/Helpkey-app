# Hotel Sections Update

## Overview
Organized hotels into three distinct sections for better user experience and discoverability.

## New Hotel Sections

### 1. **Hotels Near You**
- Shows the first 5 hotels from the filtered results
- Displays all hotels that match current filters
- "See all" button to view complete list
- Perfect for quick browsing of nearby options

### 2. **Hourly Hotels**
- Automatically filters hotels with hourly booking rooms
- Only shows hotels where `room.bookingType === 'hourly'` or `'both'`
- Green "HOURLY" badge on cards
- Price displays as "per hour" instead of "per night"
- "See all" button sets booking type filter to 'hourly'
- Shows up to 5 hotels

### 3. **Nightly Hotels**
- Filters hotels with nightly booking rooms
- Only shows hotels where `room.bookingType === 'nightly'` or `'both'`
- Standard pricing display "per night"
- "See all" button sets booking type filter to 'nightly'
- Shows up to 5 hotels

## Features

### Section Headers
- Consistent header style across all sections
- Section title on the left
- "See all" link on the right (blue color)
- Tappable to navigate to filtered view

### Hotel Card Enhancements
- **Hourly Badge**: Green badge with "HOURLY" text (top-left)
- **Discount Badge**: Red badge with percentage (top-right)
- **Dynamic Pricing Label**: Shows "per hour" or "per night" based on context
- **Google Ratings**: Consistent across all sections

### Smart Filtering
- Sections automatically hide if no hotels match criteria
- Each section respects global filters (price, stars, amenities, search)
- Sections update in real-time as filters change

### User Flow
1. User sees "Hotels near you" first (general browsing)
2. Can explore "Hourly Hotels" for short stays
3. Can explore "Nightly Hotels" for overnight stays
4. Each "See all" button applies appropriate filter
5. Filter chips at top allow quick switching between all sections

## Technical Implementation

### Hotel Card Props
```typescript
interface HotelCardProps {
  hotel: Hotel;
  showHourlyBadge?: boolean; // Shows green HOURLY badge
}
```

### Section Logic
```typescript
// Hotels Near You - First 5 from filtered results
hotels.slice(0, 5)

// Hourly Hotels - Filter by booking type
hotels.filter(h => 
  h.rooms.some(r => 
    r.bookingType === 'hourly' || r.bookingType === 'both'
  )
).slice(0, 5)

// Nightly Hotels - Filter by booking type
hotels.filter(h => 
  h.rooms.some(r => 
    r.bookingType === 'nightly' || r.bookingType === 'both'
  )
).slice(0, 5)
```

### Conditional Rendering
- Sections only render if they have hotels to display
- Empty state shows when no hotels match any criteria
- Loading state shows during data fetch

## Styling

### New Styles Added
```typescript
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  marginBottom: 16,
}

seeAllText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#0066FF',
}

hourlyBadge: {
  position: 'absolute',
  top: 12,
  left: 12,
  backgroundColor: '#34C759', // Green
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
}

hourlyBadgeText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '700',
}
```

## User Benefits

1. **Better Organization**: Hotels grouped by use case
2. **Quick Discovery**: Find hourly or nightly hotels instantly
3. **Clear Pricing**: Pricing context matches booking type
4. **Visual Indicators**: Badges help identify hotel types
5. **Flexible Navigation**: "See all" links for deeper exploration
6. **Smart Filtering**: Sections adapt to user preferences

## Example Scenarios

### Scenario 1: User needs a quick rest
1. Scrolls to "Hourly Hotels" section
2. Sees green HOURLY badges
3. Prices shown "per hour"
4. Taps "See all" to see more options

### Scenario 2: User planning overnight stay
1. Scrolls to "Nightly Hotels" section
2. Sees standard hotel cards
3. Prices shown "per night"
4. Can apply additional filters (stars, amenities)

### Scenario 3: User browsing generally
1. Starts with "Hotels near you"
2. Sees mix of all available hotels
3. Can explore specific sections below
4. Uses filter chips to refine results

## Future Enhancements

Potential additions:
- "Luxury Hotels" section (4-5 stars)
- "Budget Hotels" section (price < threshold)
- "Top Rated" section (rating > 4.5)
- "Recently Viewed" section
- "Favorites" section
- Distance-based sorting in "Hotels near you"
- Map view for "Hotels near you"

## Notes

- All sections respect global filters
- Sections dynamically show/hide based on availability
- "See all" buttons provide quick filter shortcuts
- Consistent card design across all sections
- Smooth horizontal scrolling experience
