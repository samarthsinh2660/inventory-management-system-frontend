import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { AuditLog, AuditLogsState, FetchAuditLogsParams, DeleteLogParams, FlagLogParams, FlagLogResponse} from '@/types/log';
import { ApiResponse } from '@/types/inventory';
import { getAuthHeader } from '@/utils/authHelper';

const initialState: AuditLogsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    page: 1,
    limit: 10,
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
      if (params.entry_id) queryParams.append('entry_id', params.entry_id.toString());
      if (params.action) queryParams.append('action', params.action);
      if (params.user_id) queryParams.append('user_id', params.user_id.toString());
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.is_flag !== undefined) queryParams.append('is_flag', params.is_flag.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ApiResponse<AuditLog[]>>(`${API_URL}/audit-logs${query}`, getAuthHeader(token));
      return response.data;
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
      
      const response = await axios.get<ApiResponse<AuditLog>>(`${API_URL}/audit-logs/${id}`, getAuthHeader(token));
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
      
      const response = await axios.get<ApiResponse<AuditLog[]>>(`${API_URL}/audit-logs/record-type/${recordType}`, getAuthHeader(token));
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch all audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        if (action.payload.meta) {
          state.meta = action.payload.meta;
        }
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
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

export const { setSelectedLog, clearSelectedLog, clearError } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;