import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { Product, ProductSearchParams, CreateProductData, UpdateProductData, ProductsState, ProductFetchParams, ProductsApiResponse, ProductApiResponse } from '@/types/product';
import { getAuthHeader } from '@/utils/authHelper';

// Legacy API response interface (keeping for backward compatibility)
interface LegacyApiResponse<T> {
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


const initialState: ProductsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
};


export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: ProductSearchParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.subcategory_id) queryParams.append('subcategory_id', params.subcategory_id.toString());
      if (params.location_id) queryParams.append('location_id', params.location_id.toString());
      if (params.source_type) queryParams.append('source_type', params.source_type);
      if (params.formula_id) queryParams.append('formula_id', params.formula_id.toString());
      if (params.component_id) queryParams.append('component_id', params.component_id.toString());
      if (params.purchase_info_id) queryParams.append('purchase_info_id', params.purchase_info_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ProductsApiResponse>(`${API_URL}/products${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to fetch products');
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
      
      const response = await axios.get<ProductApiResponse>(`${API_URL}/products/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to fetch product');
      }
      return rejectWithValue('Failed to fetch product');
    }
  }
);

// Deprecated: Use fetchProducts instead as it now handles all search/filter functionality
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (params: ProductSearchParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.subcategory_id) queryParams.append('subcategory_id', params.subcategory_id.toString());
      if (params.location_id) queryParams.append('location_id', params.location_id.toString());
      if (params.source_type) queryParams.append('source_type', params.source_type);
      if (params.formula_id) queryParams.append('formula_id', params.formula_id.toString());
      if (params.component_id) queryParams.append('component_id', params.component_id.toString());
      if (params.purchase_info_id) queryParams.append('purchase_info_id', params.purchase_info_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get<ProductsApiResponse>(`${API_URL}/products${query}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to search products');
      }
      return rejectWithValue('Failed to search products');
    }
  }
);


export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (data: CreateProductData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ProductApiResponse>(`${API_URL}/products`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to create product');
      }
      return rejectWithValue('Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: number; data: UpdateProductData }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ProductApiResponse>(`${API_URL}/products/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to update product');
      }
      return rejectWithValue('Failed to update product');
    }
  }
);

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
        const data: any = error.response.data || {};
        const backendMessage = data?.error?.message || data?.message;
        return rejectWithValue(backendMessage || 'Failed to delete product');
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
          total: action.payload.meta?.total || 0,
          page: action.payload.meta?.page || 1,
          limit: action.payload.meta?.limit || 20,
          pages: action.payload.meta?.pages || 0,
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
          total: action.payload.meta?.total || 0,
          page: action.payload.meta?.page || 1,
          limit: action.payload.meta?.limit || 20,
          pages: action.payload.meta?.pages || 0,
        };
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to search products';
      })

      // Create product
      .addCase(createProduct.fulfilled, (state, action) => {
        state.list.push(action.payload.data);
        state.meta.total = (state.meta.total || 0) + 1;
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
        state.meta.total = Math.max(0, (state.meta.total || 0) - 1);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to delete product';
      });
  },
});

export const { setSelectedProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;