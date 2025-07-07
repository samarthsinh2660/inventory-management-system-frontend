import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { Product, ProductSearchParams, CreateProductData, UpdateProductData, ProductsState, ProductFetchParams } from '@/types/product';
import { getAuthHeader } from '@/utils/authHelper';

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


const initialState: ProductsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    count: 0,
  },
};


export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: ProductFetchParams = {}, { rejectWithValue, getState }) => {
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