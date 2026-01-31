import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export default function LoadingScreen({ 
  message = "Loading...", 
  showLogo = true 
}: LoadingScreenProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Fade in animation for text
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
          duration: 800,
      easing: Easing.out(Easing.ease),
          useNativeDriver: true,
    });
    spinAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      fadeAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Loading spinner */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {/* Single clean ring */}
          <View style={styles.ring} />
        </Animated.View>
        {/* App logo/icon in center */}
        {showLogo && (
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>H</Text>
            </View>
          </View>
        )}
      </View>

      {/* Loading text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeValue,
          },
        ]}
      >
        <Text style={styles.loadingText}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0e27',
    opacity: 0.9,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#00D4FF',
    borderRightColor: '#00D4FF',
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D4FF',
  },
  textContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
