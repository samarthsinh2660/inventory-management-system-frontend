import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleUsers } from '../../data/sampleData';

interface User {
  id: number;
  username: string;
  is_master: boolean;
  created_at: string;
}

interface UsersState {
  list: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleUsers;
});

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return id;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(u => u.id !== action.payload);
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;