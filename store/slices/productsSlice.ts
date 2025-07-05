import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';

// Product interface updated to match API response
export interface Product {
  id: number;
  name: string;
  unit: string;
  price: string; // API returns as string like "150.00"
  category: 'raw' | 'semi' | 'finished';
  source_type: 'manufacturing' | 'trading';
  subcategory_id: number;
  location_id: number;
  min_stock_threshold: number | null;
  product_formula_id: number | null; // Renamed from formula_id
  created_at: string;
  updated_at: string;
  // Joined fields in responses
  subcategory_name?: string;
  location_name?: string;
  product_formula_name?: string; // Added for formula name
}

// API response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  timestamp: string;
}

export interface ProductsState {
  list: Product[];
  selected: Product | null;
  loading: boolean;
  error: string | null;
  meta: {
    count: number;
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

const initialState: ProductsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    count: 0,
  },
};

// Helper to get authorization header with token
const getAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Updated API thunks

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: { page?: number; limit?: number; subcategory_id?: number; name?: string } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.subcategory_id) queryParams.append('subcategory_id', params.subcategory_id.toString());
      if (params.name) queryParams.append('name', params.name);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ApiResponse<Product[]>>(`${API_URL}/products${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch products');
      }
      return rejectWithValue('Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Product>>(`${API_URL}/products/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch product');
      }
      return rejectWithValue('Failed to fetch product');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (params: ProductSearchParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Product[]>>(`${API_URL}/products/search`, { params, ...getAuthHeader(token) });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to search products');
      }
      return rejectWithValue('Failed to search products');
    }
  }
);

export interface ProductSearchParams {
  search?: string;
  category?: 'raw' | 'semi' | 'finished';
  subcategory_id?: number;
  location_id?: number;
  source_type?: 'manufacturing' | 'trading';
  formula_id?: number;
  component_id?: number;
  is_parent?: boolean;
  is_component?: boolean;
  page?: number;
  limit?: number;
}

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: CreateProductData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ApiResponse<Product>>(`${API_URL}/products`, productData, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create product');
      }
      return rejectWithValue('Failed to create product');
    }
  }
);

export interface CreateProductData {
  name: string;
  unit: string;
  category: 'raw' | 'semi' | 'finished';
  source_type: 'manufacturing' | 'trading';
  subcategory_id: number;
  location_id: number;
  min_stock_threshold?: number | null;
  price?: number;
  product_formula_id?: number | null;
}

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: UpdateProductData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<Product>>(`${API_URL}/products/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update product');
      }
      return rejectWithValue('Failed to update product');
    }
  }
);

export interface UpdateProductData {
  id: number;
  data: Partial<Omit<CreateProductData, 'id'>>;
}

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/products/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete product');
      }
      return rejectWithValue('Failed to delete product');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct: (state, action) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.meta = {
          count: action.payload.meta?.count ?? (action.payload.data?.length || 0),
          ...action.payload.meta,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch products';
      })

      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch product';
      })

      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.meta = {
          count: action.payload.meta?.total ?? (action.payload.data?.length || 0),
          ...action.payload.meta,
        };
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to search products';
      })

      // Create product
      .addCase(createProduct.fulfilled, (state, action) => {
        state.list.push(action.payload.data);
        state.meta.count = (state.meta.count || 0) + 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to create product';
      })

      // Update product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update product';
      })

      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.count = Math.max(0, (state.meta.count || 0) - 1);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to delete product';
      });
  },
});

export const { setSelectedProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;