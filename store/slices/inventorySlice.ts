import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { ApiResponse, InventoryEntry, InventoryBalance, InventoryState, FetchInventoryParams, FetchUserEntriesParams, CreateInventoryEntryData, UpdateInventoryEntryData, InventoryEntryFilters, FilteredInventoryEntriesResponse } from '@/types/inventory';
import { getAuthHeader } from '@/utils/authHelper';

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
    pages: 0,
    filters_applied: {}
  },
  balanceMeta: {
    totalProducts: 0
  },
  filters: {
    search: '',
    entry_type: undefined,
    user_id: undefined,
    location_id: undefined,
    reference_id: '',
    product_id: undefined,
    category: '',
    subcategory_id: undefined,
    date_from: '',
    date_to: '',
    days: undefined,
    page: 1,
    limit: 10
  }
};


// New search/filter thunk for inventory entries
export const searchInventoryEntries = createAsyncThunk(
  'inventory/searchEntries',
  async (filters: InventoryEntryFilters, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters to query string
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.entry_type) queryParams.append('entry_type', filters.entry_type);
      if (filters.user_id) queryParams.append('user_id', filters.user_id.toString());
      if (filters.location_id) queryParams.append('location_id', filters.location_id.toString());
      if (filters.reference_id) queryParams.append('reference_id', filters.reference_id);
      if (filters.product_id) queryParams.append('product_id', filters.product_id.toString());
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.subcategory_id) queryParams.append('subcategory_id', filters.subcategory_id.toString());
      if (filters.date_from) queryParams.append('date_from', filters.date_from);
      if (filters.date_to) queryParams.append('date_to', filters.date_to);
      if (filters.days) queryParams.append('days', filters.days.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<FilteredInventoryEntriesResponse>(`${API_URL}/inventory${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to search inventory entries');
      }
      return rejectWithValue('Failed to search inventory entries');
    }
  }
);

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
      const response = await axios.get<ApiResponse<{ username: string; entries: InventoryEntry[]; }>>(`${API_URL}/inventory/user-entries${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch user inventory entries');
      }
      return rejectWithValue('Failed to fetch user inventory entries');
    }
  }
);


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
    // Filter management actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        entry_type: undefined,
        user_id: undefined,
        location_id: undefined,
        reference_id: '',
        product_id: undefined,
        category: '',
        subcategory_id: undefined,
        date_from: '',
        date_to: '',
        days: undefined,
        page: 1,
        limit: 10
      };
    },
    setSearchTerm: (state, action) => {
      state.filters.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search inventory entries
      .addCase(searchInventoryEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchInventoryEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
        if (action.payload.meta) {
          state.meta = {
            ...state.meta,
            ...action.payload.meta
          };
        }
      })
      .addCase(searchInventoryEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to search inventory entries';
      })

      // Fetch inventory entries
      .addCase(fetchInventoryEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
        if (action.payload.meta) {
          state.meta = {
            ...state.meta,
            ...action.payload.meta
          };
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
          state.meta = {
            ...state.meta,
            ...action.payload.meta
          };
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

export const { clearError, setSelectedEntry, clearSelectedEntry, setFilters, clearFilters, setSearchTerm } = inventorySlice.actions;
export default inventorySlice.reducer;