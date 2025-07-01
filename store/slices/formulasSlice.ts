import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sampleFormulas } from '../../data/sampleData';

interface FormulaComponent {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
}

interface Formula {
  id: number;
  name: string;
  description?: string;
  components: FormulaComponent[];
  created_at: string;
}

interface FormulasState {
  list: Formula[];
  loading: boolean;
  error: string | null;
}

const initialState: FormulasState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchFormulas = createAsyncThunk('formulas/fetchFormulas', async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return sampleFormulas;
});

export const createFormula = createAsyncThunk(
  'formulas/createFormula',
  async (data: {
    name: string;
    description?: string;
    components: { product_id: number; quantity: number }[];
  }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newFormula = {
      id: Math.max(...sampleFormulas.map(f => f.id)) + 1,
      ...data,
      components: data.components.map((comp, index) => ({
        id: index + 1,
        product_name: `Product ${comp.product_id}`,
        ...comp,
      })),
      created_at: new Date().toISOString(),
    };
    
    return newFormula;
  }
);

const formulasSlice = createSlice({
  name: 'formulas',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormulas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormulas.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchFormulas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch formulas';
      })
      .addCase(createFormula.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearError } = formulasSlice.actions;
export default formulasSlice.reducer;