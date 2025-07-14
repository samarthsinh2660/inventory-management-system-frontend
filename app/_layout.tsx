// Import the polyfill at the very top to ensure it's loaded first
import '../utils/backHandlerPolyfill';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import ErrorBoundary from '../components/ErrorBoundary';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { store, persistor } from '../store';
import { initAuth } from '../store/slices/authSlice';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { setupAxiosInterceptors } from '../utils/axiosInterceptor';

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
    // Set up axios interceptors for global auth handling
    setupAxiosInterceptors();
    
    // Initialize authentication by loading tokens and user profile
    const initialize = async () => {
      try {
        await store.dispatch(initAuth()).unwrap();
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };
    
    initialize();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(master)" options={{ headerShown: false }} />
        <Stack.Screen name="(employee)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/user-management" options={{ headerShown: false }} />
        <Stack.Screen name="(user)/users" options={{ headerShown: false }} />
        <Stack.Screen name="(alerts)/alerts" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)/statistics" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)/inventory" options={{ headerShown: false }} />
        <Stack.Screen name="audit/audit" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)/settings" options={{ headerShown: false }} />
        <Stack.Screen name="create-product" options={{ headerShown: false }} />
        <Stack.Screen name="demo-info" options={{ headerShown: false }} />
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
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
          <PaperProvider theme={theme}>
            <AppContent />
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </ErrorBoundary>
  );
}