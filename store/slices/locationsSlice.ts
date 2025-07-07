import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { Location, LocationsState, CreateLocationData, UpdateLocationData } from '@/types/product';
import { getAuthHeader } from '@/utils/authHelper';



// API response interface
interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
  meta?: {
    count?: number;
  };
}



const initialState: LocationsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    count: 0
  }
};

// GET all locations
export const fetchLocations = createAsyncThunk(
  'locations/fetchLocations',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Location[]>>(`${API_URL}/locations`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch locations');
      }
      return rejectWithValue('Failed to fetch locations');
    }
  }
);

// GET location by ID
export const fetchLocationById = createAsyncThunk(
  'locations/fetchLocationById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Location>>(`${API_URL}/locations/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch location');
      }
      return rejectWithValue('Failed to fetch location');
    }
  }
);

export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async (locationData: CreateLocationData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Set default factory_id to 1 if not provided
      const dataToSubmit = {
        ...locationData,
        factory_id: locationData.factory_id ?? 1
      };
      
      const response = await axios.post<ApiResponse<Location>>(`${API_URL}/locations`, dataToSubmit, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create location');
      }
      return rejectWithValue('Failed to create location');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ id, data }: UpdateLocationData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<Location>>(`${API_URL}/locations/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update location');
      }
      return rejectWithValue('Failed to update location');
    }
  }
);

// DELETE location
export const deleteLocation = createAsyncThunk(
  'locations/deleteLocation',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/locations/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete location');
      }
      return rejectWithValue('Failed to delete location');
    }
  }
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedLocation: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedLocation: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all locations
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.meta = {
          count: action.payload.meta?.count ?? action.payload.data.length
        };
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch locations';
      })
      
      // Fetch location by ID
      .addCase(fetchLocationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchLocationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch location';
      })
      
      // Create location
      .addCase(createLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data);
        state.meta.count = (state.meta.count || 0) + 1;
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create location';
      })
      
      // Update location
      .addCase(updateLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(l => l.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update location';
      })
      
      // Delete location
      .addCase(deleteLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(l => l.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.count = Math.max(0, (state.meta.count || 0) - 1);
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete location';
      });
  },
});

export const { clearError, setSelectedLocation, clearSelectedLocation } = locationsSlice.actions;
export default locationsSlice.reducer;