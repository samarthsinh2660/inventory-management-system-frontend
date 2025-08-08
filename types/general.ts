  // Interface for view mode state
  export type ViewMode = 'all' | 'mine';

export type SizeProps = 'small' | 'large' | number | undefined;
export interface LoadingSpinnerProps {
  size?: SizeProps;
  color?: string;
}

// Modal component interfaces
import { Product, Subcategory, Location, Formula, ProductCategory, PurchaseInfo } from './product';

// Base modal props
export interface BaseModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Location Modal Types
export interface LocationModalItem {
  id: number;
  name: string;
  address?: string | null;
  factory_id?: number | null;
}

export interface CreateLocationModalProps extends BaseModalProps {
  onSuccess?: (location: LocationModalItem) => void;
  editingLocation?: LocationModalItem;
}

// Subcategory Modal Types
export interface SubcategoryModalItem {
  id: number;
  name: string;
  description?: string | null;
  category: ProductCategory;
}

export interface CreateSubcategoryModalProps extends BaseModalProps {
  onSuccess?: (subcategory: SubcategoryModalItem) => void;
  editingSubcategory?: SubcategoryModalItem;
}

// PurchaseInfo (Supplier) Modal Types
export interface PurchaseInfoModalItem {
  id: number;
  business_name: string;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null;
  gst_number?: string | null;
}

export interface CreatePurchaseInfoModalProps extends BaseModalProps {
  onSuccess?: (purchaseInfo: PurchaseInfoModalItem) => void;
  editingPurchaseInfo?: PurchaseInfoModalItem;
}

// Formula Modal Types
export interface FormulaComponentModalItem {
  component_id: number;
  component_name?: string;
  quantity: number;
}

export interface FormulaModalItem {
  id: number;
  name: string;
  description?: string | null;
  components: FormulaComponentModalItem[];
}

export interface CreateFormulaModalProps extends BaseModalProps {
  onSuccess?: (formula: FormulaModalItem) => void;
  editingFormula?: FormulaModalItem;
}

// Product Details Modal Types
export interface ProductModalItem {
  id: number;
  name: string;
  price: string | number;
  unit: string;
  category: string;
  subcategory_id: number;
  location_id: number;
  source_type: string;
  min_stock_threshold: number | null;
  product_formula_id?: number | null;
  purchase_info_id?: number | null;
  subcategory_name?: string;
  location_name?: string;
  product_formula_name?: string;
  formula_name?: string;
  description?: string;
  total_stock?: number;
  low_stock?: boolean;
  is_manual?: boolean;
  created_at?: string;
  updated_at?: string;
  // Supplier information (joined from PurchaseInfo)
  purchase_business_name?: string | null;
  purchase_address?: string | null;
  purchase_phone?: string | null;
  purchase_email?: string | null;
  purchase_gst?: string | null;
}

export interface ProductFormulaDetails {
  id: number;
  name: string;
  description?: string | null;
  components: FormulaComponentModalItem[];
}

export interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  product: ProductModalItem | null;
  onProductUpdated?: () => void;
}

// All Balances Modal Types
export interface BalanceModalItem {
  product_id: number;
  product_name: string;
  total_quantity: number;
  location_id: number;
  location_name: string;
  price_per_unit: number;
  total_price: number;
  product_unit: string;
  min_stock_threshold: number;
  category: string;
  subcategory_name: string;
  stock_status: string;
  total_value: number;
}

// User Modal Types
export interface UserModalItem {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
  created_at?: string;
}

export interface CreateUserModalProps extends BaseModalProps {
  onSuccess?: (user: UserModalItem) => void;
}

export interface EditUserModalProps extends BaseModalProps {
  user: UserModalItem;
  onSuccess?: (user: UserModalItem) => void;
}

// Inventory Entry Modal Types
export interface InventoryEntryModalItem {
  id: number;
  product_id: number;
  quantity: number;
  entry_type: string;
  timestamp: string;
  user_id: number;
  location_id: number;
  notes?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  product_name: string;
  location_name: string;
  username?: string;
}

export interface InventoryEntryDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  entry: InventoryEntryModalItem | null;
}

// Product Filters Modal Types
export interface ProductFiltersState {
  category: string;
  subcategory_id: number;
  location_id: number;
  source_type: string;
  formula_id: number;
}

export interface ProductFiltersModalProps extends BaseModalProps {
  filters: ProductFiltersState;
  onApplyFilters: (filters: ProductFiltersState) => void;
  subcategories: SubcategoryModalItem[];
  locations: LocationModalItem[];
  formulas: FormulaModalItem[];
  purchaseInfos?: PurchaseInfoModalItem[];
}

// Edit Profile Modal Types
export interface ProfileFormData {
  name: string;
  email: string;
  username: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface EditProfileFormProps {
  initialData: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Inventory Filters Modal Types
export interface InventoryFiltersState {
  search: string;
  entry_type: string;
  user_id: number;
  location_id: number;
  reference_id: string;
  product_id: number;
  category: string;
  subcategory_id: number;
  date_from: string;
  date_to: string;
  days: number;
}

export interface InventoryFiltersModalProps extends BaseModalProps {
  filters: InventoryFiltersState;
  onApplyFilters: (filters: InventoryFiltersState) => void;
  subcategories: SubcategoryModalItem[];
  locations: LocationModalItem[];
  users: UserModalItem[];
  products: ProductModalItem[];
} 