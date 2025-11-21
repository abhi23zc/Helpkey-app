import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.85;
const SLIDER_HEIGHT = 72;
const BUTTON_SIZE = 60;
const TRACK_PADDING = 6;
const MAX_SLIDE = (SLIDER_WIDTH - BUTTON_SIZE - TRACK_PADDING * 2)  

export default function SlideToStart({ onSlideComplete } :{onSlideComplete:any}) {
  const translateX = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const arrowOpacity = useSharedValue(0.7);
  const progressValue = useSharedValue(0);
  const isMounted = useRef(true);
  const hasTriggered = useRef(false); // Prevents multiple triggers
  const [count, setCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
     setCount(count=>count+1)
     
     
    }, [])
  );


  useEffect(() => {
    
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    arrowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );

    return () => {
      isMounted.current = false;
      cancelAnimation(pulseValue);
      cancelAnimation(arrowOpacity);
      cancelAnimation(translateX);
      cancelAnimation(progressValue);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newValue = Math.min(Math.max(0, event.translationX), MAX_SLIDE);
      translateX.value = newValue;
      progressValue.value = newValue / MAX_SLIDE;

      if (!hasTriggered.current && progressValue.value >= 0.5) {
        hasTriggered.current = true;
        runOnJS(onSlideComplete)();
      }
    })
    .onEnd(() => {
      if (translateX.value >= MAX_SLIDE) {
        // Auto reset after reaching 90%
        translateX.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
        progressValue.value = withTiming(0);
        hasTriggered.current = false;
      } else {
        translateX.value = withSpring(0);
        progressValue.value = withTiming(0);
        hasTriggered.current = false;
      }
    });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: progressValue.value > 0.7 ? withSpring(1.1) : pulseValue.value },
    ],
    shadowOpacity: 0.2 + progressValue.value * 0.3,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1 - progressValue.value * 1.5, { duration: 200 }),
    transform: [{ translateX: withTiming(progressValue.value * 40, { duration: 300 }) }],
  }));

  const animatedArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [{ translateX: withTiming(progressValue.value * 10, { duration: 300 }) }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
    opacity: progressValue.value,
  }));

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require("../../assets/images/start.png")} 
        style={styles.track}
        resizeMode="cover"
      >
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
        <Animated.Text style={[styles.text, animatedTextStyle]}>Get Started</Animated.Text>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.button, animatedButtonStyle]}>
            <LinearGradient
              colors={["#0D3B66", "#081A35", "#000000"]}
              style={styles.buttonGradient}
            >
              <Animated.View style={animatedArrowStyle}>
                <Feather name="chevron-right" size={26} color="white" />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "transparent",
  },
  track: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    height: "100%",
    backgroundColor: "rgba(66, 125, 255, 0.3)",
    borderRadius: SLIDER_HEIGHT / 2,
  },
  text: {
    fontSize: 23,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    position: "absolute",
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    position: "absolute",
    left: TRACK_PADDING,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4E7CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
