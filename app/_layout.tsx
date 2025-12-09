import { AuthProvider } from '@/context/AuthContext';
import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
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
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
