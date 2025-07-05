import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';

export interface InventoryEntry {
  id: number;
  product_id: number;
  quantity: number;
  entry_type: 'manual_in' | 'manual_out' | 'manufacturing_in' | 'manufacturing_out';
  timestamp: string;
  user_id: number;
  location_id: number;
  notes?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  product_name: string;
  location_name: string;
  username?: string;  // Username of the user who created the entry
}

export interface InventoryBalance {
  product_id: number;
  product_name: string;
  total_quantity: number;
  location_id: number;
  location_name: string;
  price_per_unit: number;  
  total_price: number; 
}

// API response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp?: string;
}

export interface InventoryState {
  entries: InventoryEntry[];
  userEntries: InventoryEntry[];
  balance: InventoryBalance[];
  selected: InventoryEntry | null;
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  balanceMeta: {
    totalProducts: number;
  };
}

const initialState: InventoryState = {
  entries: [],
  userEntries: [],
  balance: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  balanceMeta: {
    totalProducts: 0
  }
};

// Fetch all inventory entries with optional pagination
export interface FetchInventoryParams {
  page?: number;
  limit?: number;
  product_id?: number;
  entry_type?: 'manual_in' | 'manual_out' | 'manufacturing_in' | 'manufacturing_out';
  start_date?: string;
  end_date?: string;
}

// Helper to get authorization header with token
const getAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const fetchInventoryEntries = createAsyncThunk(
  'inventory/fetchEntries',
  async (params: FetchInventoryParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.product_id) queryParams.append('product_id', params.product_id.toString());
      if (params.entry_type) queryParams.append('entry_type', params.entry_type);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ApiResponse<InventoryEntry[]>>(`${API_URL}/inventory${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch inventory entries');
      }
      return rejectWithValue('Failed to fetch inventory entries');
    }
  }
);

// Fetch inventory entry by ID
export const fetchInventoryEntryById = createAsyncThunk(
  'inventory/fetchEntryById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<InventoryEntry>>(`${API_URL}/inventory/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch inventory entry');
      }
      return rejectWithValue('Failed to fetch inventory entry');
    }
  }
);

// Fetch inventory balance
export const fetchInventoryBalance = createAsyncThunk(
  'inventory/fetchBalance',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<{
        products: InventoryBalance[],
        total_products: number
      }>>(`${API_URL}/inventory/balance`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch inventory balance');
      }
      return rejectWithValue('Failed to fetch inventory balance');
    }
  }
);

// Fetch user-specific inventory entries
export interface FetchUserEntriesParams {
  page?: number;
  limit?: number;
}

export const fetchUserEntries = createAsyncThunk(
  'inventory/fetchUserEntries',
  async (params: FetchUserEntriesParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ApiResponse<{ username: string; entries: InventoryEntry[]; }>>(`${API_URL}/user-entries${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch user inventory entries');
      }
      return rejectWithValue('Failed to fetch user inventory entries');
    }
  }
);

// Create inventory entry
export interface CreateInventoryEntryData {
  product_id: number;
  quantity: number;
  entry_type: 'manual_in' | 'manual_out' | 'manufacturing_in' | 'manufacturing_out';
  location_id: number;
  notes?: string;
  reference_id?: string;
}

export const createInventoryEntry = createAsyncThunk(
  'inventory/createEntry',
  async (data: CreateInventoryEntryData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ApiResponse<InventoryEntry>>(`${API_URL}/inventory`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create inventory entry');
      }
      return rejectWithValue('Failed to create inventory entry');
    }
  }
);

// Update inventory entry (master only)
export interface UpdateInventoryEntryData {
  id: number;
  data: Partial<CreateInventoryEntryData>;
}

export const updateInventoryEntry = createAsyncThunk(
  'inventory/updateEntry',
  async ({ id, data }: UpdateInventoryEntryData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<InventoryEntry>>(`${API_URL}/inventory/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update inventory entry');
      }
      return rejectWithValue('Failed to update inventory entry');
    }
  }
);

// Delete inventory entry (master only)
export const deleteInventoryEntry = createAsyncThunk(
  'inventory/deleteEntry',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/inventory/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete inventory entry');
      }
      return rejectWithValue('Failed to delete inventory entry');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedEntry: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedEntry: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all inventory entries
      .addCase(fetchInventoryEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
        if (action.payload.meta) {
          state.meta = action.payload.meta;
        }
      })
      .addCase(fetchInventoryEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch inventory entries';
      })

      // Fetch entry by ID
      .addCase(fetchInventoryEntryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryEntryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchInventoryEntryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch inventory entry';
      })

      // Fetch inventory balance
      .addCase(fetchInventoryBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.data?.products || [];
        state.balanceMeta.totalProducts = action.payload.data?.total_products || 0;
      })
      .addCase(fetchInventoryBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch inventory balance';
      })

      // Fetch user entries
      .addCase(fetchUserEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.userEntries = action.payload.data?.entries || [];
        if (action.payload.meta) {
          state.meta = action.payload.meta;
        }
      })
      .addCase(fetchUserEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch user inventory entries';
      })

      // Create inventory entry
      .addCase(createInventoryEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInventoryEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload.data);
        state.meta.total = (state.meta.total || 0) + 1;
      })
      .addCase(createInventoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create inventory entry';
      })

      // Update inventory entry
      .addCase(updateInventoryEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventoryEntry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entries.findIndex(e => e.id === action.payload.data.id);
        if (index !== -1) {
          state.entries[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateInventoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update inventory entry';
      })

      // Delete inventory entry
      .addCase(deleteInventoryEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInventoryEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter(e => e.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.total = Math.max(0, (state.meta.total || 0) - 1);
      })
      .addCase(deleteInventoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete inventory entry';
      });
  },
});

export const { clearError, setSelectedEntry, clearSelectedEntry } = inventorySlice.actions;
export default inventorySlice.reducer;