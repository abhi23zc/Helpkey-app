import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, MapPin, Search as SearchIcon, Sparkles } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface GradientHeaderProps {
  userName: string;
  userPhoto?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onNotificationPress?: () => void;
  userLocation?: string;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
}

const GradientHeader = ({
  userName,
  userPhoto,
  searchQuery,
  onSearchChange,
  onNotificationPress,
  userLocation = 'India',
  onLocationPress,
  onSearchPress,
}: GradientHeaderProps) => {
  // Animations
  const pulseAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    // Pulsing notification dot
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Profile image glow
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Sparkle rotation
    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
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

  const glowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(glowAnim.value, [0, 1], [0.3, 0.8]);
    return {
      shadowOpacity,
    };
  });

  const sparkleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${sparkleRotate.value}deg` }],
    };
  });

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1f3a', '#2a2f4a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientHeader}
    >
      {/* Animated background particles */}
      <View style={styles.particlesContainer}>
        <Animated.View style={[styles.particle, styles.particle1]} />
        <Animated.View style={[styles.particle, styles.particle2]} />
        <Animated.View style={[styles.particle, styles.particle3]} />
      </View>

      <View style={styles.headerTop}>
        <TouchableOpacity activeOpacity={0.8}>
          <Animated.View style={[styles.profileImageContainer, glowStyle]}>
            <Image
              source={{
                uri:
                  userPhoto ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
              }}
              contentFit="cover"
              transition={300}
              style={styles.profileImage}
            />
            <View style={styles.profileRing} />

          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.locationContainer}
          onPress={onLocationPress}
          activeOpacity={0.7}
        >
          <View style={styles.glassEffect}>
            <MapPin size={16} color="#00D9FF" />
            <Text style={styles.locationText}>{userLocation}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <View style={styles.glassEffect}>
            <Bell size={22} color="#fff" />
            <Animated.View style={[styles.notificationDot, pulseStyle]} />
            <View style={styles.notificationDotCore} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Text with gradient */}
      <View style={styles.heroSection}>
        <Text style={styles.heroText}>
          Find <Text style={styles.heroHighlight}>Hotels, Villas,</Text>
        </Text>
        <Text style={styles.heroText}>
          <Text style={styles.heroHighlight}>Lodging,</Text> that are around you!
        </Text>
        <View style={styles.heroUnderline} />
      </View>

      {/* Glassmorphic Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={onSearchPress}
          activeOpacity={0.9}
        >
          <View style={styles.searchGlass}>
            <SearchIcon size={20} color="rgba(255,255,255,0.7)" style={styles.searchIconLeft} />
            <TextInput
              placeholder="Find the best Hotels"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={onSearchChange}
              editable={false}
              pointerEvents="none"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearchPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00D9FF', '#0099FF', '#0066FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchButtonGradient}
          >
            <SearchIcon size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
    position: 'relative',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  particle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  particle2: {
    width: 100,
    height: 100,
    top: 100,
    left: -20,
    backgroundColor: 'rgba(138, 43, 226, 0.08)',
  },
  particle3: {
    width: 80,
    height: 80,
    bottom: 20,
    right: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 10,
  },
  profileImageContainer: {
    position: 'relative',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 8,
  },
  profileImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: 'rgba(0, 217, 255, 0.6)',
  },
  profileRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    top: -4,
    left: -4,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(10, 14, 39, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  locationContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  notificationButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.5)',
  },
  notificationDotCore: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  heroSection: {
    marginBottom: 32,
    zIndex: 10,
  },
  heroText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  heroHighlight: {
    fontWeight: '800',
    background: 'linear-gradient(90deg, #00D9FF, #0099FF)',
    color: '#00D9FF',
  },
  heroUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#00D9FF',
    borderRadius: 2,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 58,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  searchIconLeft: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  searchButton: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  searchButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GradientHeader;
