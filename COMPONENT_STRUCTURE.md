# Component Structure Documentation

## Overview
The home screen has been refactored into smaller, reusable components for better maintainability and organization.

## Component Hierarchy

```
app/(tabs)/home.tsx (Main Screen)
├── GradientHeader
├── FiltersPanel
├── SectionHeader (multiple instances)
├── DestinationItem (multiple instances)
├── HotelCard (multiple instances)
└── DealCard (multiple instances)
```

## Component Files

### 📁 components/home/

```
components/home/
├── GradientHeader.tsx      # Hero section with search
├── FiltersPanel.tsx        # Collapsible filters panel
├── SectionHeader.tsx       # Section title with "See all"
├── DestinationItem.tsx     # Circular destination card
├── HotelCard.tsx          # Hotel display card
└── DealCard.tsx           # Promotional deal card
```

## Component Details

### 1. GradientHeader.tsx

**Purpose**: Displays the hero section with gradient background, user info, and search bar.

**Props**:
```typescript
interface GradientHeaderProps {
  userName: string;
  userPhoto?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onNotificationPress?: () => void;
}
```

**Features**:
- Gradient background (blue theme)
- Profile image
- Location badge
- Notification bell with dot
- Hero text ("Find Hotels, Villas, Lodging...")
- Search input
- Search button

**Usage**:
```typescript
<GradientHeader
  userName="John"
  userPhoto="https://..."
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

---

### 2. FiltersPanel.tsx

**Purpose**: Collapsible panel with all filtering options.

**Props**:
```typescript
interface FiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  priceRange: [number, number];
  maxPriceRange: number;
  onPriceRangeChange: (range: [number, number]) => void;
  selectedStars: number[];
  onStarToggle: (star: number) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  amenities: string[];
  onClearFilters: () => void;
}
```

**Features**:
- Price range buttons (Under ₹1000, ₹1000-₹2000, etc.)
- Star rating filter (1-5 stars)
- Amenities filter (WiFi, Pool, etc.)
- Clear all filters button
- Close button (X)

**Usage**:
```typescript
<FiltersPanel
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  priceRange={priceRange}
  maxPriceRange={maxPriceRange}
  onPriceRangeChange={setPriceRange}
  selectedStars={selectedStars}
  onStarToggle={handleStarFilter}
  selectedAmenities={selectedAmenities}
  onAmenityToggle={handleAmenityFilter}
  amenities={commonAmenities}
  onClearFilters={clearFilters}
/>
```

---

### 3. SectionHeader.tsx

**Purpose**: Reusable section header with title and optional "See all" link.

**Props**:
```typescript
interface SectionHeaderProps {
  title: string;
  onSeeAllPress?: () => void;
}
```

**Features**:
- Bold section title
- Optional "See all" link (blue)
- Consistent spacing

**Usage**:
```typescript
<SectionHeader 
  title="Hotels near you" 
  onSeeAllPress={() => console.log('See all')} 
/>
```

---

### 4. DestinationItem.tsx

**Purpose**: Circular destination card with image and name.

**Props**:
```typescript
interface DestinationItemProps {
  id: string;
  name: string;
  image: string;
  onPress?: () => void;
}
```

**Features**:
- Circular image (64x64)
- Destination name below
- Smooth image transitions
- Touchable

**Usage**:
```typescript
<DestinationItem
  id="1"
  name="Gurgaon"
  image="https://..."
  onPress={() => console.log('Gurgaon')}
/>
```

---

### 5. HotelCard.tsx

**Purpose**: Main hotel display card with all hotel information.

**Props**:
```typescript
interface HotelCardProps {
  hotel: Hotel;
  showHourlyBadge?: boolean;
}
```

**Features**:
- Hotel image with fallback
- Discount badge (top-right)
- Hourly badge (top-left, optional)
- Hotel name and location
- Price display (original + current)
- Google-style rating
- Review count
- "per hour" or "per night" label

**Usage**:
```typescript
<HotelCard 
  hotel={hotelData} 
  showHourlyBadge={true} 
/>
```

**Card Size**: 280px width, responsive height

---

### 6. DealCard.tsx

**Purpose**: Promotional deal card with image overlay.

**Props**:
```typescript
interface DealCardProps {
  type: string;
  title: string;
  subtitle: string;
  image: string;
  dark?: boolean;
}
```

**Features**:
- Background image
- Gradient overlay (light or dark)
- Type badge (LONGSTAY, PREPAID)
- Deal title and subtitle
- Smooth image transitions

**Usage**:
```typescript
<DealCard
  type="LONGSTAY"
  title="55% off"
  subtitle="Longstay Hotels"
  image="https://..."
  dark={false}
/>
```

---

## Main Screen Structure

### app/(tabs)/home.tsx

**Responsibilities**:
- State management (filters, hotels, loading)
- Data fetching (fetchHotelsWithRooms)
- Filter logic
- Layout composition

**State Variables**:
```typescript
const [allHotels, setAllHotels] = useState<Hotel[]>([]);
const [hotels, setHotels] = useState<Hotel[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
const [maxPriceRange, setMaxPriceRange] = useState(5000);
const [selectedStars, setSelectedStars] = useState<number[]>([]);
const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'rating'>('recommended');
const [showFilters, setShowFilters] = useState(false);
```

**Key Functions**:
- `fetchHotels()` - Fetches hotels from Firebase
- `handleStarFilter()` - Toggles star rating filter
- `handleAmenityFilter()` - Toggles amenity filter
- `clearFilters()` - Resets all filters

---

## Benefits of Component Structure

### 1. **Maintainability**
- Each component has a single responsibility
- Easy to locate and fix bugs
- Clear separation of concerns

### 2. **Reusability**
- Components can be used in other screens
- Consistent UI across the app
- DRY (Don't Repeat Yourself) principle

### 3. **Testability**
- Each component can be tested independently
- Props-based testing is straightforward
- Mock data is easier to manage

### 4. **Scalability**
- Easy to add new features
- Components can be extended without affecting others
- New developers can understand code faster

### 5. **Performance**
- Components can be memoized individually
- Smaller re-render scope
- Better optimization opportunities

---

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| home.tsx | ~400 | Main screen logic |
| GradientHeader.tsx | ~180 | Header component |
| FiltersPanel.tsx | ~300 | Filters component |
| SectionHeader.tsx | ~40 | Section header |
| DestinationItem.tsx | ~40 | Destination card |
| HotelCard.tsx | ~200 | Hotel card |
| DealCard.tsx | ~100 | Deal card |

**Total**: ~1,260 lines (vs ~1,000 lines in single file)

---

## Migration Guide

### To use the refactored version:

1. **Backup current file**:
   ```bash
   cp app/(tabs)/home.tsx app/(tabs)/home-backup.tsx
   ```

2. **Replace with refactored version**:
   ```bash
   cp app/(tabs)/home-refactored.tsx app/(tabs)/home.tsx
   ```

3. **Verify components exist**:
   ```
   components/home/
   ├── GradientHeader.tsx
   ├── FiltersPanel.tsx
   ├── SectionHeader.tsx
   ├── DestinationItem.tsx
   ├── HotelCard.tsx
   └── DealCard.tsx
   ```

4. **Test the app**:
   ```bash
   npm start
   ```

---

## Future Enhancements

### Potential Component Additions:

1. **FilterChips.tsx**
   - Extract filter chips into separate component
   - Props: chips array, active chip, onPress

2. **HotelSection.tsx**
   - Wrapper for hotel sections
   - Props: title, hotels, showHourlyBadge

3. **EmptyState.tsx**
   - Reusable empty state component
   - Props: title, subtitle, icon

4. **LoadingState.tsx**
   - Reusable loading component
   - Props: message

5. **PriceRangeSlider.tsx**
   - Custom slider for price range
   - Props: min, max, value, onChange

---

## Best Practices

### 1. **Component Naming**
- Use PascalCase for component names
- Descriptive names (HotelCard, not Card)
- Suffix with component type if needed

### 2. **Props Interface**
- Always define TypeScript interfaces
- Use descriptive prop names
- Mark optional props with `?`

### 3. **Styling**
- Keep styles in the same file
- Use StyleSheet.create()
- Consistent naming (camelCase)

### 4. **File Organization**
```
components/
├── home/           # Home screen components
├── hotel/          # Hotel detail components
├── booking/        # Booking components
└── shared/         # Shared components
```

### 5. **Import Order**
1. React imports
2. React Native imports
3. Third-party libraries
4. Local imports (types, utils, components)

---

## Testing

### Component Testing Example:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import HotelCard from '@/components/home/HotelCard';

describe('HotelCard', () => {
  const mockHotel = {
    id: '1',
    name: 'Test Hotel',
    price: 1000,
    // ... other props
  };

  it('renders hotel name', () => {
    const { getByText } = render(<HotelCard hotel={mockHotel} />);
    expect(getByText('Test Hotel')).toBeTruthy();
  });

  it('shows hourly badge when prop is true', () => {
    const { getByText } = render(
      <HotelCard hotel={mockHotel} showHourlyBadge={true} />
    );
    expect(getByText('HOURLY')).toBeTruthy();
  });
});
```

---

## Performance Optimization

### Memoization:

```typescript
import React, { memo } from 'react';

const HotelCard = memo(({ hotel, showHourlyBadge }: HotelCardProps) => {
  // Component code
});

export default HotelCard;
```

### Use Cases:
- HotelCard (re-renders frequently)
- DestinationItem (static data)
- DealCard (static data)

---

## Summary

✅ **6 reusable components created**
✅ **Clean separation of concerns**
✅ **Type-safe with TypeScript**
✅ **Easy to maintain and extend**
✅ **Better performance potential**
✅ **Consistent styling**
✅ **Well-documented**

The refactored structure makes the codebase more professional, maintainable, and scalable for future development.
