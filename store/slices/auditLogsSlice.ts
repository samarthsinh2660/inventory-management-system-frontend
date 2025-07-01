import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleAuditLogs } from '../../data/sampleData';

interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id: number;
  username: string;
  created_at: string;
}

interface AuditLogsState {
  list: AuditLog[];
  selected: AuditLog | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuditLogsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchAuditLogs = createAsyncThunk('auditLogs/fetchAuditLogs', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleAuditLogs;
});

export const revertChange = createAsyncThunk(
  'auditLogs/revertChange',
  async (id: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Change reverted successfully' };
  }
);

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {
    setSelectedLog: (state, action) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch audit logs';
      });
  },
});

export const { setSelectedLog, clearError } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;