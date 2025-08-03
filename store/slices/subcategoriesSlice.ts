import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';
import { Subcategory, SubcategoriesState, CreateSubcategoryData, UpdateSubcategoryData, ProductCategory } from '@/types/product';
import { getAuthHeader } from '@/utils/authHelper';

// API response interface
interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
  meta?: {
    count?: number;
  };
}

const initialState: SubcategoriesState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  meta: {
    count: 0
  }
};

// GET subcategories with optional category filter
export const fetchSubcategories = createAsyncThunk(
  'subcategories/fetchSubcategories',
  async (category: ProductCategory | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build URL with optional category parameter
      const url = category 
        ? `${API_URL}/subcategories?category=${category}`
        : `${API_URL}/subcategories`;
      
      const response = await axios.get<ApiResponse<Subcategory[]>>(url, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch subcategories');
      }
      return rejectWithValue('Failed to fetch subcategories');
    }
  }
);

// Keep the old function name as an alias for backward compatibility
export const fetchSubcategoriesByCategory = fetchSubcategories;

// GET subcategory by ID
export const fetchSubcategoryById = createAsyncThunk(
  'subcategories/fetchSubcategoryById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Subcategory>>(`${API_URL}/subcategories/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch subcategory');
      }
      return rejectWithValue('Failed to fetch subcategory');
    }
  }
);


export const createSubcategory = createAsyncThunk(
  'subcategories/createSubcategory',
  async (subcategoryData: CreateSubcategoryData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ApiResponse<Subcategory>>(`${API_URL}/subcategories`, subcategoryData, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create subcategory');
      }
      return rejectWithValue('Failed to create subcategory');
    }
  }
);


export const updateSubcategory = createAsyncThunk(
  'subcategories/updateSubcategory',
  async ({ id, data }: UpdateSubcategoryData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<Subcategory>>(`${API_URL}/subcategories/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update subcategory');
      }
      return rejectWithValue('Failed to update subcategory');
    }
  }
);

// DELETE subcategory
export const deleteSubcategory = createAsyncThunk(
  'subcategories/deleteSubcategory',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/subcategories/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete subcategory');
      }
      return rejectWithValue('Failed to delete subcategory');
    }
  }
);

const subcategoriesSlice = createSlice({
  name: 'subcategories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSubcategory: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedSubcategory: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all subcategories
      .addCase(fetchSubcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.meta = {
          count: action.payload.meta?.count ?? (action.payload.data?.length || 0)
        };
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch subcategories';
      })
      
      // Fetch subcategory by ID
      .addCase(fetchSubcategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchSubcategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch subcategory';
      })
      
      // Create subcategory
      .addCase(createSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data);
        state.meta.count = (state.meta.count || 0) + 1;
      })
      .addCase(createSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create subcategory';
      })
      
      // Update subcategory
      .addCase(updateSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(s => s.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update subcategory';
      })
      
      // Delete subcategory
      .addCase(deleteSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(s => s.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.count = Math.max(0, (state.meta.count || 0) - 1);
      })
      .addCase(deleteSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete subcategory';
      });
  },
});

export const { clearError, setSelectedSubcategory, clearSelectedSubcategory } = subcategoriesSlice.actions;
export default subcategoriesSlice.reducer;