import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          presentation: 'transparentModal',
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: false,
          presentation: 'transparentModal',
        }} 
      />
    </Stack>
  );
}