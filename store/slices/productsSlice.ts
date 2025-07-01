import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleProducts } from '../../data/sampleData';

interface Product {
  id: number;
  name: string;
  unit: string;
  cost: number;
  category: 'raw' | 'semi' | 'finished';
  source_type: 'manufacturing' | 'trading';
  subcategory_id: number;
  location_id: number;
  min_stock_threshold?: number;
  formula_id?: number;
  current_stock?: number;
  subcategory_name?: string;
  location_name?: string;
  created_at: string;
}

interface ProductsState {
  list: Product[];
  selected: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleProducts;
});

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: Omit<Product, 'id' | 'created_at' | 'current_stock' | 'subcategory_name' | 'location_name'>) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newProduct = {
      ...productData,
      id: Math.max(...sampleProducts.map(p => p.id)) + 1,
      current_stock: 0,
      created_at: new Date().toISOString(),
    };
    
    return newProduct;
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, ...productData }: { id: number } & Partial<Product>) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingProduct = sampleProducts.find(p => p.id === id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    return { ...existingProduct, ...productData };
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return id;
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
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
      });
  },
});

export const { setSelectedProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;