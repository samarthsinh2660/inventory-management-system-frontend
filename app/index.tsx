import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { initAuth, logout, clearAuth } from '../store/slices/authSlice';
import { TokenData } from '@/types/user';

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, user, loading } = useAppSelector(state => state.auth);
  const [initializing, setInitializing] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<TokenData>(token);
      if (!decoded.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return decoded.exp <= currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize auth from storage
        await dispatch(initAuth());
        setInitializing(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    if (initializing || loading) return;

    const handleNavigation = async () => {
      // If we have a token, check if it's expired
      if (accessToken) {
        if (isTokenExpired(accessToken)) {
          console.log('Token expired during initialization, logging out');
          await dispatch(logout());
          dispatch(clearAuth());
          router.replace('/login');
          return;
        }

        // If token is valid and we have user data, redirect based on role
        if (user) {
          if (user.role === 'master') {
            router.replace('/(master)' as any);
          } else {
            router.replace('/(employee)' as any);
          }
        } else {
          // Token exists but no user data, redirect to login
          router.replace('/login');
        }
      } else {
        // No token, redirect to login
        router.replace('/login');
      }
    };

    handleNavigation();
  }, [accessToken, user, router, initializing, loading, dispatch]);

  return (
    <View style={styles.container}>
      <LoadingSpinner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});