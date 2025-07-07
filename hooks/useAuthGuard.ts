import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { logout, refreshToken, clearAuth } from '../store/slices/authSlice';
import { TokenData } from '@/types/user';

export const useAuthGuard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken: refreshTokenValue, user } = useAppSelector(state => state.auth);

  // Check if token is expired or about to expire
  const isTokenExpired = useCallback((token: string, bufferMinutes: number = 5): boolean => {
    try {
      const decoded = jwtDecode<TokenData>(token);
      if (!decoded.exp) return true;
      
      const currentTime = Date.now() / 1000; // Convert to seconds
      const bufferTime = bufferMinutes * 60; // Convert minutes to seconds
      
      return decoded.exp <= (currentTime + bufferTime);
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Treat invalid tokens as expired
    }
  }, []);

  // Handle token expiry and logout
  const handleTokenExpiry = useCallback(async () => {
    console.log('Token expired, logging out user');
    await dispatch(logout());
    dispatch(clearAuth());
    router.replace('/login');
  }, [dispatch, router]);

  // Attempt to refresh token
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      if (!refreshTokenValue) {
        console.log('No refresh token available');
        return false;
      }

      console.log('Attempting to refresh token...');
      const result = await dispatch(refreshToken());
      
      if (refreshToken.fulfilled.match(result)) {
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.log('Token refresh failed:', result.payload);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [dispatch, refreshTokenValue]);

  // Main auth check function
  const checkAuth = useCallback(async () => {
    // If no token or user, redirect to login
    if (!accessToken || !user) {
      console.log('No access token or user, redirecting to login');
      router.replace('/login');
      return;
    }

    // Check if token is expired or about to expire
    if (isTokenExpired(accessToken)) {
      console.log('Token is expired or about to expire');
      
      // Try to refresh token first
      const refreshSuccessful = await attemptTokenRefresh();
      
      if (!refreshSuccessful) {
        // If refresh fails, logout and redirect
        await handleTokenExpiry();
      }
    }
  }, [accessToken, user, router, isTokenExpired, attemptTokenRefresh, handleTokenExpiry]);

  // Set up periodic token checking
  useEffect(() => {
    // Check auth immediately
    checkAuth();

    // Set up interval to check token every 5 minutes
    const interval = setInterval(() => {
      checkAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkAuth]);

  // Check auth when route changes (navigation events)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated: !!(accessToken && user),
    checkAuth,
    isTokenExpired: accessToken ? isTokenExpired(accessToken) : true
  };
}; 