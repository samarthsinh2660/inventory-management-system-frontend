import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { PurchaseInfo, PurchaseInfoState, CreatePurchaseInfoData, UpdatePurchaseInfoData } from '@/types/product';
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

const initialState: PurchaseInfoState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    count: 0
  }
};

// GET all purchase info with optional search
export const fetchPurchaseInfo = createAsyncThunk(
  'purchaseInfo/fetchPurchaseInfo',
  async (search: string | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build URL with optional search parameter
      const url = search 
        ? `${API_URL}/purchase-info?search=${encodeURIComponent(search)}`
        : `${API_URL}/purchase-info`;
      
      const response = await axios.get<ApiResponse<PurchaseInfo[]>>(url, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch purchase info');
      }
      return rejectWithValue('Failed to fetch purchase info');
    }
  }
);

// GET purchase info by ID
export const fetchPurchaseInfoById = createAsyncThunk(
  'purchaseInfo/fetchPurchaseInfoById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<PurchaseInfo>>(`${API_URL}/purchase-info/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch purchase info');
      }
      return rejectWithValue('Failed to fetch purchase info');
    }
  }
);

// CREATE purchase info
export const createPurchaseInfo = createAsyncThunk(
  'purchaseInfo/createPurchaseInfo',
  async (purchaseInfoData: CreatePurchaseInfoData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ApiResponse<PurchaseInfo>>(`${API_URL}/purchase-info`, purchaseInfoData, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create purchase info');
      }
      return rejectWithValue('Failed to create purchase info');
    }
  }
);

// UPDATE purchase info
export const updatePurchaseInfo = createAsyncThunk(
  'purchaseInfo/updatePurchaseInfo',
  async ({ id, data }: UpdatePurchaseInfoData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<PurchaseInfo>>(`${API_URL}/purchase-info/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update purchase info');
      }
      return rejectWithValue('Failed to update purchase info');
    }
  }
);

// DELETE purchase info
export const deletePurchaseInfo = createAsyncThunk(
  'purchaseInfo/deletePurchaseInfo',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/purchase-info/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete purchase info');
      }
      return rejectWithValue('Failed to delete purchase info');
    }
  }
);

const purchaseInfoSlice = createSlice({
  name: 'purchaseInfo',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPurchaseInfo: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedPurchaseInfo: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all purchase info
      .addCase(fetchPurchaseInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.meta = {
          count: action.payload.meta?.count ?? (action.payload.data?.length || 0)
        };
      })
      .addCase(fetchPurchaseInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch purchase info';
      })
      
      // Fetch purchase info by ID
      .addCase(fetchPurchaseInfoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInfoById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchPurchaseInfoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch purchase info';
      })
      
      // Create purchase info
      .addCase(createPurchaseInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data);
        state.meta.count = (state.meta.count || 0) + 1;
      })
      .addCase(createPurchaseInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create purchase info';
      })
      
      // Update purchase info
      .addCase(updatePurchaseInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseInfo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(p => p.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updatePurchaseInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update purchase info';
      })
      
      // Delete purchase info
      .addCase(deletePurchaseInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(p => p.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.count = Math.max(0, (state.meta.count || 0) - 1);
      })
      .addCase(deletePurchaseInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete purchase info';
      });
  },
});

export const { clearError, setSelectedPurchaseInfo, clearSelectedPurchaseInfo } = purchaseInfoSlice.actions;
export default purchaseInfoSlice.reducer;
