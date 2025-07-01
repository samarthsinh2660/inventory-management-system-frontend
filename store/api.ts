import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Replace with your backend URL
  timeout: 10000,
});

// Add request interceptor for token
api.interceptors.request.use(
  (config) => {
    // Token will be set by auth slice
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // Could dispatch logout action here
    }
    return Promise.reject(error);
  }
);

export default api;