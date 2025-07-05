import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/constant';

// Updated interface to match API response
interface FormulaComponent {
  id: number;
  component_id: number;
  component_name: string;
  quantity: number;
}

export interface Formula {
  id: number;
  name: string;
  description: string | null;
  components: FormulaComponent[];
  created_at: string;
  updated_at: string;
}

// API response interface
interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
  meta?: {
    count?: number;
  };
}

export interface FormulasState {
  list: Formula[];
  selected: Formula | null;
  relatedProducts: any[];
  loading: boolean;
  error: string | null;
  meta: {
    count: number;
  };
}

const initialState: FormulasState = {
  list: [],
  selected: null,
  relatedProducts: [],
  loading: false,
  error: null,
  meta: {
    count: 0
  }
};

// Helper to get authorization header with token
const getAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// GET all formulas
export const fetchFormulas = createAsyncThunk(
  'formulas/fetchFormulas',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Formula[]>>(`${API_URL}/formulas`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch formulas');
      }
      return rejectWithValue('Failed to fetch formulas');
    }
  }
);

// GET formula by ID
export const fetchFormulaById = createAsyncThunk(
  'formulas/fetchFormulaById',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<Formula>>(`${API_URL}/formulas/${id}`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch formula');
      }
      return rejectWithValue('Failed to fetch formula');
    }
  }
);

// GET products using formula
export const fetchFormulaProducts = createAsyncThunk(
  'formulas/fetchFormulaProducts',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/formulas/${id}/products`, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch formula products');
      }
      return rejectWithValue('Failed to fetch formula products');
    }
  }
);

// Define CreateFormulaData interface
export interface CreateFormulaData {
  name: string;
  description?: string | null;
  components: {
    component_id: number;
    quantity: number;
  }[];
}

// POST create formula
export const createFormula = createAsyncThunk(
  'formulas/createFormula',
  async (formulaData: CreateFormulaData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post<ApiResponse<Formula>>(`${API_URL}/formulas`, formulaData, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to create formula');
      }
      return rejectWithValue('Failed to create formula');
    }
  }
);

// Define UpdateFormulaData interface
export interface UpdateFormulaData {
  id: number;
  data: Partial<CreateFormulaData>;
}

// PUT update formula
export const updateFormula = createAsyncThunk(
  'formulas/updateFormula',
  async ({ id, data }: UpdateFormulaData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<Formula>>(`${API_URL}/formulas/${id}`, data, getAuthHeader(token));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update formula');
      }
      return rejectWithValue('Failed to update formula');
    }
  }
);

// DELETE formula
export const deleteFormula = createAsyncThunk(
  'formulas/deleteFormula',
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/formulas/${id}`, getAuthHeader(token));
      return id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete formula');
      }
      return rejectWithValue('Failed to delete formula');
    }
  }
);

// Define FormulaComponentData interface
export interface FormulaComponentData {
  formulaId: number;
  componentData: {
    id?: number;
    component_id: number;
    quantity: number;
  };
}

// PUT add/update formula component
export const updateFormulaComponent = createAsyncThunk(
  'formulas/updateFormulaComponent',
  async ({ formulaId, componentData }: FormulaComponentData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put<ApiResponse<Formula>>(
        `${API_URL}/formulas/${formulaId}/component`, 
        componentData, 
        getAuthHeader(token)
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to update formula component');
      }
      return rejectWithValue('Failed to update formula component');
    }
  }
);

// DELETE formula component
export const deleteFormulaComponent = createAsyncThunk(
  'formulas/deleteFormulaComponent',
  async ({ formulaId, componentId }: { formulaId: number; componentId: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { accessToken: string | null } };
      const token = state.auth.accessToken;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.delete<ApiResponse<Formula>>(
        `${API_URL}/formulas/${formulaId}/component/${componentId}`,
        getAuthHeader(token)
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to delete formula component');
      }
      return rejectWithValue('Failed to delete formula component');
    }
  }
);

const formulasSlice = createSlice({
  name: 'formulas',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedFormula: (state, action) => {
      state.selected = action.payload;
    },
    clearSelectedFormula: (state) => {
      state.selected = null;
      state.relatedProducts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all formulas
      .addCase(fetchFormulas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormulas.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.meta = {
          count: action.payload.meta?.count ?? action.payload.data.length
        };
      })
      .addCase(fetchFormulas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch formulas';
      })
      
      // Fetch formula by ID
      .addCase(fetchFormulaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormulaById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchFormulaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch formula';
      })
      
      // Fetch products using formula
      .addCase(fetchFormulaProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormulaProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.relatedProducts = action.payload.data;
      })
      .addCase(fetchFormulaProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch formula products';
      })
      
      // Create formula
      .addCase(createFormula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFormula.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data);
        state.meta.count = (state.meta.count || 0) + 1;
      })
      .addCase(createFormula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create formula';
      })
      
      // Update formula
      .addCase(updateFormula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFormula.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(f => f.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateFormula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update formula';
      })
      
      // Delete formula
      .addCase(deleteFormula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFormula.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(f => f.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        state.meta.count = Math.max(0, (state.meta.count || 0) - 1);
      })
      .addCase(deleteFormula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete formula';
      })
      
      // Update formula component
      .addCase(updateFormulaComponent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFormulaComponent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(f => f.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(updateFormulaComponent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update formula component';
      })
      
      // Delete formula component
      .addCase(deleteFormulaComponent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFormulaComponent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(f => f.id === action.payload.data.id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.selected?.id === action.payload.data.id) {
          state.selected = action.payload.data;
        }
      })
      .addCase(deleteFormulaComponent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete formula component';
      });
  },
});

export const { clearError, setSelectedFormula, clearSelectedFormula } = formulasSlice.actions;
export default formulasSlice.reducer;