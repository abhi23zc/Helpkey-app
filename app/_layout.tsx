import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from '@/components/SplashScreen';
import { StyleSheet } from 'react-native';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();

        // Pre-load any resources here
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = () => {
    setShowCustomSplash(false);
  };

  if (!isReady || showCustomSplash) {
    return <CustomSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <SafeAreaProvider>

      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NotificationProvider>
            <SafeAreaView style={styles.container} >
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="hotel/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="hotel/amenities" options={{ headerShown: false }} />
                <Stack.Screen name="hotel/booking" options={{ headerShown: false }} />
                <Stack.Screen name="hotel/payment" options={{ headerShown: false }} />
                <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="profile/saved-guests" options={{ headerShown: false }} />
                <Stack.Screen name="profile/verification" options={{ headerShown: false }} />
                <Stack.Screen name="profile/personal-info" options={{ headerShown: false }} />
                <Stack.Screen name="profile/phone-number" options={{ headerShown: false }} />
                <Stack.Screen name="admin/notifications" options={{ headerShown: false }} />
                <Stack.Screen name="admin/index" options={{ headerShown: false }} />
                <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
                <Stack.Screen name="admin/bookings" options={{ headerShown: false }} />
                <Stack.Screen name="admin/hotels" options={{ headerShown: false }} />
                <Stack.Screen name="admin/rooms" options={{ headerShown: false }} />
                <Stack.Screen name="admin/test" options={{ headerShown: false }} />
                <Stack.Screen name="admin/auth-test" options={{ headerShown: false }} />
                <Stack.Screen name="admin/debug" options={{ headerShown: false }} />
              </Stack>
            </SafeAreaView>
          </NotificationProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  }
});
