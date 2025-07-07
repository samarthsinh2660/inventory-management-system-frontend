import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import {TokenData ,User, UserRole } from '@/types/user';


// Helper to decode JWT token and create user object
export const decodeTokenAndCreateUser = (token: string): User => {
  try {
    const decoded = jwtDecode<TokenData>(token);
    return {
      id: decoded.id,
      username: decoded.username || '',
      name: decoded.name || decoded.username || '',
      email: decoded.email,
      role: decoded.is_master ? UserRole.MASTER : UserRole.EMPLOYEE
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    throw new Error('Invalid token');
  }
};

// Helper to save tokens to local storage
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    console.log('Tokens saved successfully');
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

// Helper to clear tokens from local storage
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('token'); // Clear legacy token if exists
    console.log('Tokens cleared successfully');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Helper to clear all mock/test data
export const clearAllStorageData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All storage data cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Helper to get tokens from AsyncStorage
export const getTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    // Check for legacy token
    if (!accessToken) {
      const legacyToken = await AsyncStorage.getItem('token');
      if (legacyToken) {
        console.log('Found legacy token');
        return { accessToken: legacyToken, refreshToken: null };
      }
    }
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Determine role from API response - handles both role string and is_master boolean
export const determineRole = (data: any): UserRole => {
  if (data?.role === UserRole.MASTER) return UserRole.MASTER;
  if (data?.is_master === true) return UserRole.MASTER;
  return UserRole.EMPLOYEE;
};

// Helper to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenData>(token);
    const currentTime = Date.now() / 1000;
    return (decoded.exp || 0) < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if can't decode
  }
};

// Helper to get user from stored token
export const getUserFromStoredToken = async (): Promise<User | null> => {
  try {
    const { accessToken } = await getTokens();
    if (!accessToken || isTokenExpired(accessToken)) {
      return null;
    }
    return decodeTokenAndCreateUser(accessToken);
  } catch (error) {
    console.error('Error getting user from stored token:', error);
    return null;
  }
};

// Helper to get authorization header with token
export const getAuthHeader = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
  });