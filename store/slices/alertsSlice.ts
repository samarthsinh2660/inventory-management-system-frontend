import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { StockAlert, Notification, ApiResponse, AlertState, FetchAlertsParams } from '@/types/alerts';
import { getAuthHeader } from '@/utils/authHelper';

const initialState: AlertState = {
  alerts: [],
  notifications: [],
  loading: false,
  error: null,
  meta: {
    page: 1,
    limit: 10,
    total: 0
  }
};



// Thunk for fetching alerts
export const fetchAlerts = createAsyncThunk(
  'alert/fetchAlerts',
  async (params: FetchAlertsParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ApiResponse<StockAlert[]>>(`${API_URL}/alerts${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch alerts');
      }
      return rejectWithValue('Failed to fetch alerts');
    }
  }
);

// Thunk for checking alerts (triggering an alert check)
export const checkAlerts = createAsyncThunk(
  'alert/checkAlerts',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post<ApiResponse<{ message: string }>>(`${API_URL}/alerts/check`, {}, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to check for alerts');
      }
      return rejectWithValue('Failed to check for alerts');
    }
  }
);

// Thunk for resolving an alert
export const resolveAlert = createAsyncThunk(
  'alert/resolveAlert',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.patch<ApiResponse<{ message: string }>>(`${API_URL}/alerts/${id}/resolve`, {}, getAuthHeader(token));
      return { id, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to resolve alert');
      }
      return rejectWithValue('Failed to resolve alert');
    }
  }
);

// Thunk for fetching notifications
export const fetchNotifications = createAsyncThunk(
  'alert/fetchNotifications',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get<ApiResponse<Notification[]>>(`${API_URL}/notifications`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch notifications');
      }
      return rejectWithValue('Failed to fetch notifications');
    }
  }
);

// Thunk for marking a notification as read
export const markNotificationAsRead = createAsyncThunk(
  'alert/markNotificationAsRead',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.patch<ApiResponse<{ message: string }>>(`${API_URL}/notifications/${id}/read`, {}, getAuthHeader(token));
      return { id, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to mark notification as read');
      }
      return rejectWithValue('Failed to mark notification as read');
    }
  }
);

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAlerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.data;
        
        if (action.payload.page !== undefined) {
          state.meta.page = action.payload.page;
        }
        
        if (action.payload.limit !== undefined) {
          state.meta.limit = action.payload.limit;
        }
        
        if (action.payload.total !== undefined) {
          state.meta.total = action.payload.total;
        }
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch alerts';
      })
      
      // Handle checkAlerts
      .addCase(checkAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAlerts.fulfilled, (state) => {
        state.loading = false;
        // We don't update any state data here since we'll need to fetch alerts again
        // to get the latest alerts after checking
      })
      .addCase(checkAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to check for alerts';
      })
      
      // Handle resolveAlert
      .addCase(resolveAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the resolved alert in state
        const alertId = action.payload.id;
        const index = state.alerts.findIndex(alert => alert.id === alertId);
        
        if (index !== -1) {
          state.alerts[index] = {
            ...state.alerts[index],
            is_resolved: true,
            resolved_at: new Date().toISOString()
          };
        }
        
        // Also update any notifications that reference this alert
        state.notifications = state.notifications.filter(
          notification => notification.stock_alert_id !== alertId
        );
      })
      .addCase(resolveAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to resolve alert';
      })
      
      // Handle fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch notifications';
      })
      
      // Handle markNotificationAsRead
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Mark notification as read in state
        const notificationId = action.payload.id;
        const index = state.notifications.findIndex(notification => notification.id === notificationId);
        
        if (index !== -1) {
          state.notifications[index] = {
            ...state.notifications[index],
            is_read: true
          };
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to mark notification as read';
      });
  }
});

export const { clearError } = alertSlice.actions;
export default alertSlice.reducer;
