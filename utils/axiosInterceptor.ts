import axios from 'axios';
import { store } from '../store';
import { logout, clearAuth } from '../store/slices/authSlice';

let isLoggedOut = false; // Prevent multiple logout calls

// Response interceptor to handle 401 errors globally
export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => {
      // Reset logout flag on successful response
      isLoggedOut = false;
      return response;
    },
    async (error) => {
      const { response } = error;
      
      // Handle 401 Unauthorized errors
      if (response?.status === 401 && !isLoggedOut) {
        console.log('401 Unauthorized detected, logging out user');
        isLoggedOut = true;
        
        try {
          // Dispatch logout action
          await store.dispatch(logout());
          store.dispatch(clearAuth());
          
          console.log('User logged out due to 401 error');
        } catch (logoutError) {
          console.error('Error during automatic logout:', logoutError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Request interceptor to add authorization header
  axios.interceptors.request.use(
    (config) => {
      const state = store.getState();
      const token = state.auth.accessToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Function to manually reset the logout flag (useful for testing)
export const resetLogoutFlag = () => {
  isLoggedOut = false;
}; 