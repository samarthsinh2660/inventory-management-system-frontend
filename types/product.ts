export enum ProductCategory {
    RAW = 'raw',
    SEMI = 'semi',
    FINISHED = 'finished'
}

export enum ProductSourceType {
    MANUFACTURING = 'manufacturing',
    TRADING = 'trading'
}

// PurchaseInfo (Supplier) interface
export interface PurchaseInfo {
    id: number;
    business_name: string;
    address?: string | null;
    phone_number?: string | null;
    email?: string | null;
    gst_number?: string | null;
    created_at: string;
    updated_at: string;
}

// PurchaseInfo state interface
export interface PurchaseInfoState {
    list: PurchaseInfo[];
    selected: PurchaseInfo | null;
    loading: boolean;
    error: string | null;
    meta: {
      count: number;
    };
}

// Create PurchaseInfo data interface
export interface CreatePurchaseInfoData {
    business_name: string;
    address?: string | null;
    phone_number?: string | null;
    email?: string | null;
    gst_number?: string | null;
}

// Update PurchaseInfo data interface
export interface UpdatePurchaseInfoData {
    id: number;
    data: Partial<CreatePurchaseInfoData>;
}

// Product interface updated to match API response
export interface Product {
    id: number;
    name: string;
    unit: string;
    price: string; // API returns as string like "150.00"
    category: ProductCategory;
    source_type: ProductSourceType;
    subcategory_id: number;
    location_id: number;
    min_stock_threshold: number | null;
    product_formula_id: number | null; // Renamed from formula_id
    purchase_info_id?: number | null; // Link to supplier
    created_at: string;
    updated_at: string;
    // Joined fields in responses
    subcategory_name?: string;
    location_name?: string;
    product_formula_name?: string; // Added for formula name
    // Purchase info fields (from JOIN queries)
    purchase_business_name?: string | null;
    purchase_address?: string | null;
    purchase_phone?: string | null;
    purchase_email?: string | null;
    purchase_gst?: string | null;
  }

  export interface ProductsState {
    list: Product[];
    selected: Product | null;
    loading: boolean;
    error: string | null;
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }

  export interface ProductFetchParams {
    page?: number; 
    limit?: number; 
    subcategory_id?: number; 
    name?: string
  }

  export interface ProductSearchParams {
    search?: string;
    category?: ProductCategory;
    subcategory_id?: number;
    location_id?: number;
    source_type?: ProductSourceType;
    formula_id?: number;
    component_id?: number;
    purchase_info_id?: number;
    page?: number;
    limit?: number;
  }

  export interface CreateProductData {
    name: string;
    unit: string;
    category: ProductCategory;
    source_type: ProductSourceType;
    subcategory_id: number;
    location_id: number;
    min_stock_threshold?: number | null;
    price?: number;
    product_formula_id?: number | null;
    purchase_info_id?: number | null;
  }

  
export interface UpdateProductData {
    id: number;
    data: Partial<Omit<CreateProductData, 'id'>>;
  }

  export interface FormulaComponent {
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

  // Define CreateFormulaData interface
export interface CreateFormulaData {
    name: string;
    description?: string | null;
    components: {
      component_id: number;
      quantity: number;
    }[];
  }

  // Define UpdateFormulaData interface
export interface UpdateFormulaData {
    id: number;
    data: Partial<CreateFormulaData>;
  }
  

  // Define FormulaComponentData interface
export interface FormulaComponentData {
    formulaId: number;
    componentData: {
      id?: number;
      component_id: number;
      quantity: number;
    };
  }
  
  export interface Location {
    id: number;
    name: string;
    address?: string | null;
    factory_id: number | null;
  }

  export interface LocationsState {
    list: Location[];
    selected: Location | null;
    loading: boolean;
    error: string | null;
    meta: {
      count: number;
    };
  }

  // POST create location
export interface CreateLocationData {
    name: string;
    address?: string | null;
    factory_id?: number | null;
  }

  // PUT update location
export interface UpdateLocationData {
    id: number;
    data: Partial<CreateLocationData>;
  }

  export interface Subcategory {
    id: number;
    name: string;
    description?: string | null;
    category: ProductCategory;
  }

  export interface SubcategoriesState {
    list: Subcategory[];
    selected: Subcategory | null;
    loading: boolean;
    error: string | null;
    meta: {
      count: number;
    };
  }


  // POST create subcategory
export interface CreateSubcategoryData {
    name: string;
    description?: string | null;
    category: ProductCategory;
  }

  // PUT update subcategory
export interface UpdateSubcategoryData {
    id: number;
    data: Partial<CreateSubcategoryData>;
  }

  export interface CustomSearchBarProps {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
    style?: any;
    autoFocus?: boolean;
  }

  export interface CategoryBadgeProps {
    category: ProductCategory;
  }

  // Enhanced interface for component props
export interface SubcategoriesListProps {
    subcategories: Subcategory[];
    onCreateSubcategory: () => void;
    onEditSubcategory: (subcategory: Subcategory) => void;
  }
  
  // Interface for subcategory with optional extended fields from API responses
  export interface SubcategoryDisplayItem extends Subcategory {
    parent_category?: string;
    products_count?: number;
  }
  
  // Interface for FlatList render item
  export interface SubcategoryRenderItem {
    item: SubcategoryDisplayItem;
    index: number;
  }

  
export interface ManagementTabsProps {
    products: Product[];
    subcategories: Subcategory[];
    locations: Location[];
    formulas: Formula[];
    onCreateLocation: () => void;
    onEditLocation: (location: Location) => void;
    onCreateSubcategory: () => void;
    onEditSubcategory: (subcategory: Subcategory) => void;
    onCreateFormula: () => void;
    onEditFormula: (formula: Formula) => void;
    onBackToProducts: () => void;
  }
  
export  type TabType = 'products' | 'locations' | 'subcategories' | 'formulas';

export interface LocationsListProps {
    locations: Location[];
    onCreateLocation: () => void;
    onEditLocation: (location: Location) => void;
  }
  
  export interface LocationRenderItem {
    item: Location;
    index: number;
  }

  // Interface for location item with extended API properties
export interface LocationDisplayItem extends Location {
    products_count?: number;
  }
  

  export interface FormulasListProps {
    formulas: Formula[];
    onCreateFormula: () => void;
    onEditFormula: (formula: Formula) => void;
  }  

  // Interface for formula component
export interface FormulaComponentDisplay {
    component_name: string;
    quantity: number;
  }
  
  // Interface for formula item with extended API properties
  export interface FormulaDisplayItem extends Formula {
    version?: string;
    batch_size?: string;
    yield_percentage?: number;
    products_count?: number;
  }
  export interface handelProductEdit {
    name: string;
    price: string;
    min_stock_threshold: string;
    unit: string;
    category: string;
    subcategory_id: string;
    location_id: string;
    source_type: string;
    product_formula_id: string;
  } 


  export interface FilterState {
    category: string;
    subcategory_id: number;
    location_id: number;
    source_type: string;
    formula_id: number;
    component_id: number;
    purchase_info_id: number;
  }

  // API Response interface for new unified endpoint
  export interface ProductsApiResponse {
    status: string;
    message: string;
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }

  // Single product API response
  export interface ProductApiResponse {
    status: string;
    message: string;
    data: Product;
  }