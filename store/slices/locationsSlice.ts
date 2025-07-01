import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleLocations } from '../../data/sampleData';

interface Location {
  id: number;
  name: string;
  address?: string;
  created_at: string;
}

interface LocationsState {
  list: Location[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationsState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk('locations/fetchLocations', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return sampleLocations;
});

export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async (data: { name: string; address?: string }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newLocation = {
      id: Math.max(...sampleLocations.map(l => l.id)) + 1,
      ...data,
      created_at: new Date().toISOString(),
    };
    
    return newLocation;
  }
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch locations';
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearError } = locationsSlice.actions;
export default locationsSlice.reducer;