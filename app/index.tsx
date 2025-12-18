import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
  FadeInDown,
  interpolateColor,
} from 'react-native-reanimated';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const DATA = [
  {
    id: 1,
    image: require('@/assets/images/onboarding/img-1.png'),
    title: 'Luxury and Comfort,\nJust a Tap Away',
    subtitle: 'Semper in cursus magna et eu varius nunc adipiscing. Elementum justo, laoreet id sem.',
  },
  {
    id: 2,
    image: require('@/assets/images/onboarding/img-2.png'),
    title: 'Book with Ease, Stay\nwith Style',
    subtitle: 'Semper in cursus magna et eu varius nunc adipiscing. Elementum justo, laoreet id sem.',
  },
  {
    id: 3,
    image: require('@/assets/images/onboarding/img-3.png'),
    title: 'Discover Your Dream\nHotel, Effortlessly',
    subtitle: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function Onboarding() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('onboardingCompleted');
      if (value !== null) {
        router.replace('/(tabs)/home');
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Error checking onboarding status:', e);
      setIsLoading(false);
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleNext = async () => {
    if (currentIndex < DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      try {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        router.replace('/(tabs)/home');
      } catch (e) {
        console.error('Error saving onboarding status:', e);
        router.replace('/(tabs)/home');
      }
    }
  };

  if (isLoading) {
    return <View style={styles.container} />;
  }

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {DATA.map((_, index) => {
          const rStyle = useAnimatedStyle(() => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

            const dotWidth = interpolate(
              scrollX.value,
              inputRange,
              [8, 24, 8],
              Extrapolation.CLAMP
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.5, 1, 0.5],
              Extrapolation.CLAMP
            );

            const backgroundColor = interpolateColor(
              scrollX.value,
              inputRange,
              [Colors.WHITE, Colors.PRIMARY, Colors.WHITE]
            );

            return {
              width: dotWidth,
              opacity,
              backgroundColor,
            };
          });

          return <Animated.View key={index} style={[styles.dot, rStyle]} />;
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: typeof DATA[0] }) => {
    return (
      <View style={styles.itemContainer}>
        <ImageBackground
          source={item.image}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', Colors.DARK_BLUE]}
            style={styles.gradient}
            locations={[0, 0.4, 0.7, 1]}
          />

          <View style={styles.textContainer}>
            <Animated.Text
              entering={FadeInDown.delay(200).springify()}
              style={styles.title}
            >
              {item.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(400).springify()}
              style={styles.subtitle}
            >
              {item.subtitle}
            </Animated.Text>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AnimatedFlatList
        ref={flatListRef}
        data={DATA}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={{ flex: 1 }}
      />

      <View style={styles.bottomContainer}>
        <Pagination />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.btn}
          onPress={handleNext}
        >
          <Text style={styles.btnText}>
            {currentIndex === DATA.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {currentIndex === DATA.length - 1 && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.DARK_BLUE,
  },
  itemContainer: {
    width: width,
    height: height,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    zIndex: 1,
  },
  textContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(160), // Space for buttons and pagination
    zIndex: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: Colors.WHITE,
    textAlign: 'center',
    marginBottom: verticalScale(10),
    lineHeight: moderateScale(36),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Fallback
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    maxWidth: '90%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: verticalScale(40),
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(25),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  dot: {
    height: verticalScale(8),
    borderRadius: scale(4),
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.PRIMARY,
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  btnText: {
    color: Colors.WHITE,
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: verticalScale(15),
  },
  registerText: {
    color: Colors.WHITE,
    fontSize: moderateScale(14),
  },
  registerHighlight: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
});
