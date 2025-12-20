# 🎬 Animation Reference Guide

## Helpkey App - Animation Implementation

---

## 1. Profile Image Glow Animation

### Location
`/components/home/GradientHeader.tsx`

### Implementation
```tsx
const glowAnim = useSharedValue(0);

useEffect(() => {
  glowAnim.value = withRepeat(
    withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );
}, []);

const glowStyle = useAnimatedStyle(() => {
  const shadowOpacity = interpolate(glowAnim.value, [0, 1], [0.3, 0.8]);
  return { shadowOpacity };
});
```

### Effect
- **Duration**: 3 seconds
- **Loop**: Infinite
- **Type**: Reverse (ping-pong)
- **Property**: Shadow opacity (0.3 → 0.8)
- **Color**: Cyan (#00D9FF)

---

## 2. Notification Pulse Animation

### Location
`/components/home/GradientHeader.tsx`

### Implementation
```tsx
const pulseAnim = useSharedValue(0);

useEffect(() => {
  pulseAnim.value = withRepeat(
    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );
}, []);

const pulseStyle = useAnimatedStyle(() => {
  const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.3]);
  const opacity = interpolate(pulseAnim.value, [0, 1], [1, 0.3]);
  return {
    transform: [{ scale }],
    opacity,
  };
});
```

### Effect
- **Duration**: 2 seconds
- **Loop**: Infinite
- **Type**: Reverse (ping-pong)
- **Properties**: 
  - Scale (1 → 1.3)
  - Opacity (1 → 0.3)
- **Color**: Red (#FF3B30)

---

## 3. Sparkle Rotation Animation

### Location
`/components/home/GradientHeader.tsx`

### Implementation
```tsx
const sparkleRotate = useSharedValue(0);

useEffect(() => {
  sparkleRotate.value = withRepeat(
    withTiming(360, { duration: 4000, easing: Easing.linear }),
    -1,
    false
  );
}, []);

const sparkleStyle = useAnimatedStyle(() => {
  return {
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  };
});
```

### Effect
- **Duration**: 4 seconds
- **Loop**: Infinite
- **Type**: Continuous (no reverse)
- **Property**: Rotation (0° → 360°)
- **Icon**: Gold sparkle (#FFD700)

---

## 4. Skeleton Shimmer Animation

### Location
`/components/home/SkeletonLoader.tsx`

### Implementation
```tsx
<MotiView
  from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
  animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
  transition={{
    duration: 1000,
    loop: true,
  }}
/>
```

### Effect
- **Duration**: 1 second
- **Loop**: Infinite
- **Type**: Automatic reverse
- **Property**: Background color opacity (0.05 → 0.1)
- **Library**: Moti

---

## 5. Card Press Animation

### Location
All card components (HotelCard, DealCard)

### Implementation
```tsx
<TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
  {/* Card content */}
</TouchableOpacity>
```

### Effect
- **Trigger**: On press
- **Property**: Opacity (1 → 0.85)
- **Duration**: Instant
- **Feedback**: Tactile response

---

## Animation Best Practices

### Performance
1. ✅ Use `useSharedValue` for 60fps animations
2. ✅ Use `withTiming` for smooth transitions
3. ✅ Use `interpolate` for complex animations
4. ✅ Avoid animating layout properties
5. ✅ Use `transform` instead of position

### User Experience
1. ✅ Keep animations subtle (not distracting)
2. ✅ Use easing for natural motion
3. ✅ Provide visual feedback on interactions
4. ✅ Maintain consistent animation speeds
5. ✅ Don't overuse animations

### Code Organization
1. ✅ Define animations in useEffect
2. ✅ Use descriptive variable names
3. ✅ Group related animations
4. ✅ Comment complex interpolations
5. ✅ Reuse animation patterns

---

## Animation Timing Guide

| Animation Type | Duration | Easing | Loop |
|---------------|----------|--------|------|
| Micro-interaction | 150-300ms | ease-out | No |
| Attention-grabbing | 2-3s | ease-in-out | Yes |
| Continuous motion | 3-5s | linear | Yes |
| Loading shimmer | 1-1.5s | ease-in-out | Yes |
| Hover/Press | Instant | none | No |

---

## Easing Functions

### Available Easings
```tsx
Easing.linear       // Constant speed
Easing.ease         // Smooth start and end
Easing.inOut(Easing.ease)  // Very smooth
Easing.bezier(x1, y1, x2, y2)  // Custom curve
```

### When to Use
- **Linear**: Rotation, continuous motion
- **Ease**: General purpose
- **InOut**: Pulsing, breathing effects
- **Bezier**: Custom brand animations

---

## Common Patterns

### Pulse Effect
```tsx
const pulse = useSharedValue(0);
pulse.value = withRepeat(
  withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
  -1,
  true
);
```

### Rotate Effect
```tsx
const rotate = useSharedValue(0);
rotate.value = withRepeat(
  withTiming(360, { duration: 4000, easing: Easing.linear }),
  -1,
  false
);
```

### Fade Effect
```tsx
const fade = useSharedValue(0);
fade.value = withTiming(1, { duration: 300 });
```

### Scale Effect
```tsx
const scale = useSharedValue(1);
scale.value = withSpring(1.1, { damping: 10 });
```

---

## Troubleshooting

### Animation Not Running
1. Check if `useEffect` is called
2. Verify `withRepeat` loop count (-1 for infinite)
3. Ensure component is mounted
4. Check if animation value is used in style

### Choppy Animation
1. Use `useSharedValue` instead of `useState`
2. Avoid heavy computations in animated styles
3. Use `worklet` for complex calculations
4. Reduce animation complexity

### Animation Too Fast/Slow
1. Adjust `duration` parameter
2. Change easing function
3. Modify interpolation ranges
4. Test on different devices

---

## Resources

### Documentation
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Moti Docs](https://moti.fyi/)
- [Easing Functions](https://easings.net/)

### Inspiration
- [UI Movement](https://uimovement.com/)
- [Dribbble Animations](https://dribbble.com/tags/animation)
- [Lottie Files](https://lottiefiles.com/)

---

*Animation Guide for Helpkey App*
*Created: December 20, 2025*
