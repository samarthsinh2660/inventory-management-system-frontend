import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { AuditLog, AuditLogsState, FetchAuditLogsParams, DeleteLogParams, FlagLogParams, FlagLogResponse, AuditLogsApiResponse, AuditLogFilters} from '@/types/log';
import { getAuthHeader } from '@/utils/authHelper';

const initialState: AuditLogsState = {
  list: [],
  selected: null,
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: true,
  filters: {
    page: 1,
    limit: 50
  },
  meta: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  }
};



export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAuditLogs',
  async (params: FetchAuditLogsParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters
      if (params.search) {
        // Handle reference ID search with REF= prefix
        if (params.search.startsWith('REF=')) {
          queryParams.append('search', params.search);
        } else {
          queryParams.append('search', params.search);
        }
      }
      if (params.user_id) queryParams.append('user_id', params.user_id.toString());
      if (params.location_id) queryParams.append('location_id', params.location_id.toString());
      if (params.action) queryParams.append('action', params.action);
      if (params.is_flag !== undefined) queryParams.append('is_flag', params.is_flag.toString());
      if (params.reference_id) queryParams.append('reference_id', params.reference_id);
      if (params.category) queryParams.append('category', params.category);
      if (params.subcategory_id) queryParams.append('subcategory_id', params.subcategory_id.toString());
      if (params.product_id) queryParams.append('product_id', params.product_id.toString());
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.days) queryParams.append('days', params.days.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<AuditLogsApiResponse>(`${API_URL}/audit-logs${query}`, getAuthHeader(token));
      return { ...response.data, loadMore: params.loadMore };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch audit logs');
      }
      return rejectWithValue('Failed to fetch audit logs');
    }
  }
);

// Fetch a specific audit log by ID
export const fetchAuditLogById = createAsyncThunk(
  'auditLogs/fetchAuditLogById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<{ success: boolean; data: AuditLog; message: string }>(`${API_URL}/audit-logs/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch audit log');
      }
      return rejectWithValue('Failed to fetch audit log');
    }
  }
);

// Fetch logs for a specific record type
export const fetchLogsByRecordType = createAsyncThunk(
  'auditLogs/fetchLogsByRecordType',
  async (recordType: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<AuditLogsApiResponse>(`${API_URL}/audit-logs/record-type/${recordType}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch logs by record type');
      }
      return rejectWithValue('Failed to fetch logs by record type');
    }
  }
);

export const deleteAuditLog = createAsyncThunk(
  'auditLogs/deleteAuditLog',
  async ({ id, revert = true }: DeleteLogParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/audit-logs/${id}${revert ? '?revert=true' : ''}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete audit log');
      }
      return rejectWithValue('Failed to delete audit log');
    }
  }
);

// Flag/unflag audit log
export const flagAuditLog = createAsyncThunk(
  'auditLogs/flagAuditLog',
  async ({ id, is_flag }: FlagLogParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch<FlagLogResponse>(
        `${API_URL}/audit-logs/${id}/flag`,
        { is_flag },
        getAuthHeader(token)
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to flag audit log');
      }
      return rejectWithValue('Failed to flag audit log');
    }
  }
);

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {
    setSelectedLog: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedLog: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 50
      };
      state.list = [];
      state.hasMore = true;
    },
    resetList: (state) => {
      state.list = [];
      state.hasMore = true;
      state.filters.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all audit logs
      .addCase(fetchAuditLogs.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        
        if (action.payload.loadMore) {
          // Append new logs for lazy loading
          state.list = [...state.list, ...action.payload.data];
        } else {
          // Replace logs for new search/filter
          state.list = action.payload.data;
        }
        
        if (action.payload.meta) {
          state.meta = action.payload.meta;
          // Check if there are more pages to load
          state.hasMore = action.payload.meta.page < action.payload.meta.pages;
          // Update current page in filters
          state.filters.page = action.payload.meta.page;
        }
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload as string || 'Failed to fetch audit logs';
      })

      // Fetch audit log by ID
      .addCase(fetchAuditLogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchAuditLogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch audit log';
      })

      // Fetch logs by record type
      .addCase(fetchLogsByRecordType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogsByRecordType.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        if (action.payload.meta) {
          state.meta = action.payload.meta;
        }
      })
      .addCase(fetchLogsByRecordType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch logs by record type';
      })

      // Delete audit log
      .addCase(deleteAuditLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAuditLog.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(log => log.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addCase(deleteAuditLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete audit log';
      })

      // Flag audit log
      .addCase(flagAuditLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(flagAuditLog.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLog = action.payload.data;
        state.list = state.list.map(log => 
          log.id === updatedLog.id ? updatedLog : log
        );
        if (state.selected?.id === updatedLog.id) {
          state.selected = updatedLog;
        }
      })
      .addCase(flagAuditLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to flag audit log';
      });
  },
});

export const { setSelectedLog, clearSelectedLog, clearError, setFilters, resetFilters, resetList } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;