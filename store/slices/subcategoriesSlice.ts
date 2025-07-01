import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleSubcategories } from '../../data/sampleData';

interface Subcategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface SubcategoriesState {
  list: Subcategory[];
  loading: boolean;
  error: string | null;
}

const initialState: SubcategoriesState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchSubcategories = createAsyncThunk('subcategories/fetchSubcategories', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return sampleSubcategories;
});

export const createSubcategory = createAsyncThunk(
  'subcategories/createSubcategory',
  async (data: { name: string; description?: string }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newSubcategory = {
      id: Math.max(...sampleSubcategories.map(s => s.id)) + 1,
      ...data,
      created_at: new Date().toISOString(),
    };
    
    return newSubcategory;
  }
);

const subcategoriesSlice = createSlice({
  name: 'subcategories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch subcategories';
      })
      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearError } = subcategoriesSlice.actions;
export default subcategoriesSlice.reducer;