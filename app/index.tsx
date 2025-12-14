import SlideToStart from "@/components/Button/SlideButton";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiText, MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import {
  moderateScale,
  scale,
  verticalScale,
} from "react-native-size-matters";


export default function Onboarding() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter()
  const isAuthenticated = true
  const checkAuth = async () => {
    // await authUser(dispatch);
  };

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;


    const handleNavigation = async () => {
      try {
        // await checkAuth();

        if (isAuthenticated) {
          // router.replace("/(tabs)/home");
        }
        // console.log(isAuthenticated);
      } catch (e) {
        console.log("Error occurred", e);
      }
    };

    // Uncomment when you want auto-navigation
    handleNavigation();
  }, [isAuthenticated, isReady]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/main/home.png")}
        style={styles.backgroundImage}
      >
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", duration: 1000 }}
          style={styles.content}
        >
          <View style={{ marginTop: verticalScale(100) }}>
            <MotiText
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 1000 }}
              style={styles.title}
            >
              Enjoy your vacation with
            </MotiText>
            <MotiText
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 500, duration: 1000 }}
              style={styles.subtitle}
            >
              the best hotel services!
            </MotiText>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              position: "relative",
              zIndex: 10,
              height: "100%",
              justifyContent: "center",
              paddingHorizontal: scale(20),
              width: "100%",
            }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 700, duration: 1200 }}
            >
              <SlideToStart
                onSlideComplete={() => {
                  router.push("/(tabs)/home");
                  // router.push("/auth/login");
                }}
              />
            </MotiView>
          </TouchableOpacity>
        </MotiView>
      </ImageBackground>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgb(44,44,40)"]}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: Colors.WHITE,
    fontSize: moderateScale(28),
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: scale(1.5),
  },
  subtitle: {
    color: Colors.WHITE,
    fontSize: moderateScale(25),
    fontWeight: "bold",
    textAlign: "center",
    marginTop: verticalScale(5),
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: verticalScale(0),
  },
});
