import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Building2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Animation values
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const lineScale = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const loadingOpacity = useSharedValue(0);
  const loadingWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const backgroundScale = useSharedValue(1.1);

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Background image animation
    backgroundScale.value = withTiming(1, { duration: 5000, easing: Easing.out(Easing.ease) });

    // Logo entrance
    logoOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    logoScale.value = withDelay(500, withTiming(1, { duration: 1000 }));

    // Pulsing ring animation
    pulseScale.value = withDelay(800, 
      withRepeat(
        withTiming(1.2, { duration: 2000 }),
        -1,
        true
      )
    );

    // Text animations
    textOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(800, withTiming(0, { duration: 800 }));

    // Line animation
    lineScale.value = withDelay(1000, withTiming(1, { duration: 1000 }));

    // Tagline
    taglineOpacity.value = withDelay(1200, withTiming(1, { duration: 1000 }));

    // Loading indicator
    loadingOpacity.value = withDelay(1500, withTiming(1, { duration: 500 }));
    loadingWidth.value = withDelay(1500, withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }));

    // Start exit sequence
    setTimeout(() => {
      setIsExiting(true);
      containerOpacity.value = withTiming(0, { duration: 1200 }, () => {
        runOnJS(onAnimationComplete)();
      });
    }, 3500);
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  const logoContainerStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseScale.value, [1, 1.2], [1, 1.2]);
    const opacity = interpolate(pulseScale.value, [1, 1.2], [1, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: lineScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const loadingContainerStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  const loadingProgressStyle = useAnimatedStyle(() => ({
    width: `${loadingWidth.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Image */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.imageContainer, backgroundStyle]}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop'
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Dark Gradient Overlays */}
            <LinearGradient
              colors={['#0B1221', 'rgba(11, 18, 33, 0.8)', 'transparent']}
              style={styles.gradientOverlay}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
            />
            <View style={styles.darkOverlay} />
          </ImageBackground>
        </Animated.View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated Logo */}
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
            <View style={styles.logoBackground}>
              <Building2 size={40} color="#14B8A6" />
            </View>
            
            {/* Pulsing ring */}
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
          </Animated.View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Animated.Text style={[styles.appName, textStyle]}>
            HelpKey
          </Animated.Text>
          
          <Animated.View style={[styles.line, lineStyle]} />
          
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            LUXURY BOOKING REDEFINED
          </Animated.Text>
        </View>
      </View>

      {/* Loading Indicator */}
      <Animated.View style={[styles.loadingSection, loadingContainerStyle]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingProgress, loadingProgressStyle]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.5)',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  line: {
    height: 1,
    width: width * 0.6,
    backgroundColor: '#14B8A6',
    marginBottom: 8,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '300',
    textAlign: 'center',
  },
  loadingSection: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingBar: {
    width: width * 0.4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#14B8A6',
    borderRadius: 2,
  },
});