import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockAuth, sampleUsers } from '../../data/sampleData';

interface User {
  id: number;
  username: string;
  is_master: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  error: null,
};

// Mock login function for demo
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check mock credentials
    if (username === mockAuth.masterUser.username && password === mockAuth.masterUser.password) {
      const token = 'mock-token-master';
      await AsyncStorage.setItem('token', token);
      return { token, user: mockAuth.masterUser.user };
    } else if (username === mockAuth.employeeUser.username && password === mockAuth.employeeUser.password) {
      const token = 'mock-token-employee';
      await AsyncStorage.setItem('token', token);
      return { token, user: mockAuth.employeeUser.user };
    } else {
      throw new Error('Invalid credentials');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
});

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, password, is_master }: { username: string; password: string; is_master: boolean }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if username already exists
    const existingUser = sampleUsers.find(user => user.username === username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // Create new user (in real app, this would be saved to backend)
    const newUser = {
      id: sampleUsers.length + 1,
      username,
      is_master,
      created_at: new Date().toISOString(),
    };
    
    return newUser;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      // In demo mode, determine user from token
      if (action.payload === 'mock-token-master') {
        state.user = mockAuth.masterUser.user;
      } else if (action.payload === 'mock-token-employee') {
        state.user = mockAuth.employeeUser.user;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
  },
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;