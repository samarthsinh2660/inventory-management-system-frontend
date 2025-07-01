import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleAlerts } from '../../data/sampleData';

interface Alert {
  id: number;
  product_id: number;
  product_name: string;
  current_stock: number;
  min_threshold: number;
  location_name: string;
  is_resolved: boolean;
  created_at: string;
}

interface AlertsState {
  list: Alert[];
  unresolvedCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  list: [],
  unresolvedCount: 0,
  loading: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk('alerts/fetchAlerts', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleAlerts;
});

export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async (id: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return id;
  }
);

export const checkStockAlerts = createAsyncThunk('alerts/checkStock', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return sampleAlerts;
});

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.unresolvedCount = action.payload.filter((alert: Alert) => !alert.is_resolved).length;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const alert = state.list.find(a => a.id === action.payload);
        if (alert) {
          alert.is_resolved = true;
          state.unresolvedCount = Math.max(0, state.unresolvedCount - 1);
        }
      })
      .addCase(checkStockAlerts.fulfilled, (state, action) => {
        state.list = action.payload;
        state.unresolvedCount = action.payload.filter((alert: Alert) => !alert.is_resolved).length;
      });
  },
});

export const { clearError } = alertsSlice.actions;
export default alertsSlice.reducer;