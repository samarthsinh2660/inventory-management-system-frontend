import { Product } from "@/types/product";

export enum InventoryEntryType {
    MANUAL_IN = 'manual_in',
    MANUAL_OUT = 'manual_out',
    MANUFACTURING_IN = 'manufacturing_in',
    MANUFACTURING_OUT = 'manufacturing_out',
}
export interface InventoryEntry {
    id: number;
    product_id: number;
    quantity: number;
    entry_type: InventoryEntryType;
    timestamp: string;
    user_id: number;
    location_id: number;
    notes?: string;
    reference_id?: string;
    created_at: string;
    updated_at: string;
    product_name: string;
    location_name: string;
    username?: string;  // Username of the user who created the entry
  }
  
  export interface InventoryBalance {
    product_id: number;
    product_name: string;
    total_quantity: number;
    location_id: number;
    location_name: string;
    price_per_unit: number;  
    total_price: number; 
  }
  
  // API response interface
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    meta?: {
      page: number;
      limit: number;
    };
    timestamp?: string;
}

export interface InventoryState {
    entries: InventoryEntry[];
    userEntries: InventoryEntry[];
    balance: InventoryBalance[];
    selected: InventoryEntry | null;
    loading: boolean;
    error: string | null;
    meta: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        filters_applied?: Partial<InventoryEntryFilters>;
    };
    balanceMeta: {
        totalProducts: number;
    };
    // Filter state
    filters: InventoryEntryFilters;
}

// Inventory Entry Filters interface for the new filtering API
export interface InventoryEntryFilters {
    // Search filters
    search?: string;
    
    // Entry type filters
    entry_type?: InventoryEntryType;
    
    // User/Location filters
    user_id?: number;
    location_id?: number;
    
    // Reference ID exact match
    reference_id?: string;
    
    // Product hierarchy filters
    product_id?: number;
    category?: string;
    subcategory_id?: number;
    
    // Timestamp filters
    date_from?: string;
    date_to?: string;
    days?: number;
    
    // Pagination parameters
    page?: number;
    limit?: number;
}

// Response interface for filtered inventory entries
export interface FilteredInventoryEntriesResponse {
    success: boolean;
    message: string;
    data: InventoryEntry[];
    meta: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        filters_applied: Partial<InventoryEntryFilters>;
    };
    timestamp: string;
}

// Fetch all inventory entries with optional pagination (legacy)
export interface FetchInventoryParams {
    page?: number;
    limit?: number;
    product_id?: number;
    entry_type?: InventoryEntryType;
    start_date?: string;
    end_date?: string;
}

// Fetch user-specific inventory entries with optional pagination
export interface FetchUserEntriesParams {
    page?: number;
    limit?: number;
}


// Create inventory entry
export interface CreateInventoryEntryData {
    product_id: number;
    quantity: number;
    entry_type: InventoryEntryType;
    location_id: number;
    notes?: string;
    reference_id?: string;
  }
  // Create inventory entry
  export interface CreateInventoryEntryData {
    product_id: number;
    quantity: number;
    entry_type: InventoryEntryType;
    location_id: number;
    notes?: string;
    reference_id?: string;
  }

  // Update inventory entry (master only)
export interface UpdateInventoryEntryData {
    id: number;
    data: Partial<CreateInventoryEntryData>;
  }

  export interface InventoryEntryDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    entry: any;
  }

  export interface AllBalancesModalProps {
    visible: boolean;
    onClose: () => void;
  }
  
  export type SortField = 'name' | 'quantity' | 'value' | 'price' | 'location';
  export type SortOrder = 'asc' | 'desc';
  export type StockFilter = 'all' | 'low' | 'out' | 'normal';


  
// Interface for form values
export interface InventoryFormValues {
    product_id: number;
    quantity: string;
    entry_type: InventoryEntryType;
    location_id: number;
    notes: string;
    reference_id: string;
  }
  
  // Interface for component props
  export interface StockCardProps {
    product: Product;
  }
  
  export interface EntryItemProps {
    entry: InventoryEntry;
  }
  