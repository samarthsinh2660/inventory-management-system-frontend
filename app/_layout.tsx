// Import the polyfill at the very top to ensure it's loaded first
import '../utils/backHandlerPolyfill';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { store, persistor } from '../store';
import { setToken } from '../store/slices/authSlice';
import { LoadingSpinner } from '../components/LoadingSpinner';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563eb',
    accent: '#3b82f6',
  },
};

function AppContent() {
  useFrameworkReady();

  useEffect(() => {
    // Check for existing token on app start
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          store.dispatch(setToken(token));
        }
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };
    
    loadToken();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(master)" options={{ headerShown: false }} />
        <Stack.Screen name="(employee)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(user)/users" options={{ headerShown: false }} />
        <Stack.Screen name="(alerts)/alerts" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)/statistics" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <AppContent />
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
}