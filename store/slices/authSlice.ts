import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { User, AuthState,CreateUserData, UpdateProfileData, SignInData } from '@/types/user';
import { decodeTokenAndCreateUser,saveTokens,clearTokens,determineRole } from '@/utils/authHelper';

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
};


// Signup
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData: CreateUserData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      
      // Handle both nested and direct response structures
      let responseData;
      if (response.data.data) {
        // Nested structure like: { success: true, data: { ... } }
        responseData = response.data.data;
      } else {
        // Direct structure like: { user: ..., token: ... }
        responseData = response.data;
      }
      
      const { token, refresh_token, refreshToken, user, ...userInfo } = responseData;
      
      // Use refresh_token if available, otherwise use refreshToken, otherwise empty string
      const refreshTokenToSave = refresh_token || refreshToken || '';
      
      // Create user object - handle different response formats
      let userObject;
      if (user) {
        // If user object is provided separately
        userObject = {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          email: user.email,
          role: determineRole(user)
        };
      } else {
        // If user data is in the main response
        userObject = {
          id: userInfo.id,
          username: userInfo.username,
          name: userInfo.name || userInfo.username,
          email: userInfo.email,
          role: determineRole(userInfo)
        };
      }
      
      // Save tokens to AsyncStorage
      await saveTokens(token, refreshTokenToSave);
      
      return { user: userObject, accessToken: token, refreshToken: refreshTokenToSave };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

// Signin
export const signin = createAsyncThunk(
  'auth/signin',
  async (credentials: SignInData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin`, credentials);
      
      // Handle nested response structure
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else {
        responseData = response.data;
      }
      
      const { token, refresh_token, refreshToken } = responseData;
      const refreshTokenToSave = refresh_token || refreshToken || '';
      
      // Decode the token to get user info
      const userObject = decodeTokenAndCreateUser(token);
      
      // Save tokens to AsyncStorage
      await saveTokens(token, refreshTokenToSave);
      
      return { 
        user: userObject, 
        accessToken: token, 
        refreshToken: refreshTokenToSave 
      };
    } catch (error: any) {
      console.error('Signin error:', error.response?.data);
      
      // Handle specific error codes
      if (error.response?.data?.error?.code === 20005) {
        return rejectWithValue({
          code: 20005,
          message: 'Your account is not authorized. Please contact your administrator.'
        });
      }
      
      // Handle other structured errors
      if (error.response?.data?.error?.message) {
        return rejectWithValue({
          code: error.response.data.error.code,
          message: error.response.data.error.message
        });
      }
      
      return rejectWithValue({
        code: 'UNKNOWN',
        message: 'Invalid credentials or server error'
      });
    }
  }
);

// Refresh Token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get current refresh token from state
      const state = getState() as { auth: AuthState };
      const currentRefreshToken = state.auth.refreshToken;
      
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: currentRefreshToken
      });
      
      // Handle nested response structure
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else {
        responseData = response.data;
      }
      
      const { token, refresh_token, refreshToken: newRefreshToken } = responseData;
      const refreshTokenToSave = refresh_token || newRefreshToken;
      
      // Save new tokens
      await saveTokens(token, refreshTokenToSave);
      
      return { accessToken: token, refreshToken: refreshTokenToSave };
    } catch (error: any) {
      // If refresh fails, logout user
      await clearTokens();
      return rejectWithValue('Session expired. Please sign in again.');
    }
  }
);

// Get Profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle nested response structure
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else {
        responseData = response.data;
      }
      
      // Convert response to User format
      const userObject = {
        id: responseData.id,
        username: responseData.username,
        name: responseData.name || responseData.username,
        email: responseData.email,
        role: determineRole(responseData),
        created_at: responseData.created_at
      };
      
      return userObject;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle nested response structure
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else {
        responseData = response.data;
      }
      
      // Convert response to User format
      const userObject = {
        id: responseData.id,
        username: responseData.username,
        name: responseData.name || responseData.username,
        email: responseData.email,
        role: determineRole(responseData),
        created_at: responseData.created_at
      };
      
      return userObject;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;
      
      // Optional: Call logout endpoint if your API has one
      if (token) {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (apiError) {
          // Log the error but don't fail the logout process
          console.warn('Logout API call failed:', apiError);
        }
      }
      
      // Clear tokens from AsyncStorage
      await clearTokens();
      
      // Also clear the Redux state immediately
      dispatch(clearAuth());
      
      console.log('Logout successful');
      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear tokens
      try {
        await clearTokens();
        dispatch(clearAuth());
      } catch (clearError) {
        console.error('Error clearing tokens during logout:', clearError);
      }
      return rejectWithValue('Logout failed');
    }
  }
);
// Initialize auth from storage
export const initAuth = createAsyncThunk(
  'auth/init',
  async (_, { dispatch }) => {
    try {
      let accessToken = await AsyncStorage.getItem('accessToken');
      let refreshToken = await AsyncStorage.getItem('refreshToken');
      
      // Check for legacy token storage
      if (!accessToken) {
        const legacyToken = await AsyncStorage.getItem('token');
        if (legacyToken) {
          console.log('Found legacy token, migrating to new storage format');
          accessToken = legacyToken;
          await AsyncStorage.setItem('accessToken', legacyToken);
        }
      }
      
      if (accessToken) {
        refreshToken = refreshToken || '';
        
        try {
          // Decode token to get user info
          const userObject = decodeTokenAndCreateUser(accessToken);
          
          console.log('Auth initialized with tokens and user from token');
          
          dispatch(setTokens({ accessToken, refreshToken }));
          dispatch(setUser(userObject)); // Set user from decoded token
          
          return { accessToken, refreshToken, user: userObject };
        } catch (decodeError) {
          console.error('Error decoding token during init:', decodeError);
          // If token is invalid, clear it
          await clearTokens();
          return { accessToken: null, refreshToken: null };
        }
      }
      
      console.log('No tokens found during initialization');
      return { accessToken: null, refreshToken: null };
    } catch (error) {
      console.error('Error in initAuth:', error);
      return { accessToken: null, refreshToken: null };
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = null;
      state.loading = false;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup cases
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Signup failed';
      })
      
      // Signin cases
      .addCase(signin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signin.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(signin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Login failed';
      })
      
      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        // Don't set loading true for refresh token as it's background operation
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
      // Get profile cases
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Profile update failed';
      })
      
      // Logout case
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Clear all auth state
        state.loading = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        // Even if logout fails, clear the state
        state.loading = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
      // Init auth cases
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(initAuth.rejected, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

export const { clearError, setTokens, clearAuth, setUser } = authSlice.actions;

export default authSlice.reducer;