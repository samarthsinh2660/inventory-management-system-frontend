import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleInventoryEntries, sampleProducts } from '../../data/sampleData';

interface InventoryEntry {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  entry_type: 'manual_in' | 'manual_out' | 'manufacturing_in' | 'manufacturing_out';
  location_id: number;
  location_name: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

interface InventoryState {
  entries: InventoryEntry[];
  stock: Record<number, number>;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  entries: [],
  stock: {},
  loading: false,
  error: null,
};

export const fetchInventoryEntries = createAsyncThunk('inventory/fetchEntries', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleInventoryEntries;
});

export const createInventoryEntry = createAsyncThunk(
  'inventory/createEntry',
  async (entryData: {
    product_id: number;
    quantity: number;
    entry_type: string;
    location_id: number;
    notes?: string;
  }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const product = sampleProducts.find(p => p.id === entryData.product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const newEntry = {
      id: Math.max(...sampleInventoryEntries.map(e => e.id)) + 1,
      product_name: product.name,
      location_name: product.location_name || 'Unknown Location',
      created_at: new Date().toISOString(),
      created_by: 'current_user',
      ...entryData,
    };
    
    return newEntry;
  }
);

export const fetchProductStock = createAsyncThunk(
  'inventory/fetchStock',
  async (productId: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const product = sampleProducts.find(p => p.id === productId);
    const stock = product?.current_stock || 0;
    
    return { productId, stock };
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchInventoryEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch inventory';
      })
      .addCase(createInventoryEntry.fulfilled, (state, action) => {
        state.entries.unshift(action.payload);
      })
      .addCase(fetchProductStock.fulfilled, (state, action) => {
        state.stock[action.payload.productId] = action.payload.stock;
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;