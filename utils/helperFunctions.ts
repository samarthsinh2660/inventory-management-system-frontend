// utils/dashboardHelpers.ts
import { InventoryEntry, InventoryBalance } from '@/types/inventory';
import { User } from '@/types/user';
import { Product } from '@/types/product';

export const getUsernameById = (userId: string | number, users: User[]) => {
  const foundUser = users.find(u => u.id === userId);
  return foundUser?.username || 'Unknown User';
};

export const getTodayEntries = (
  inventoryEntries: InventoryEntry[],
  userEntries: InventoryEntry[],
  users: User[],
  isMaster: boolean
) => {
  const today = new Date().toDateString();
  const entries = isMaster ? inventoryEntries : userEntries;
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.created_at).toDateString();
    return today === entryDate;
  }).map(entry => ({
    ...entry,
    // Use existing username if available, otherwise look up by user_id
    username: entry.username || getUsernameById(entry.user_id, users)
  }));
};

export const getLowStockProducts = (
  inventoryBalance: InventoryBalance[],
  products: Product[]
) => {
  return inventoryBalance.filter(item => {
    // Find matching product to get min_stock_threshold
    const product = products.find(p => p.id === item.product_id);
    return product && item.total_quantity < (product.min_stock_threshold || 0);
  }).map(item => {
    const product = products.find(p => p.id === item.product_id);
    return {
      id: item.product_id,
      name: item.product_name,
      current_stock: item.total_quantity,
      min_stock_threshold: product?.min_stock_threshold || 0,
      unit: product?.unit || '',
      location_name: item.location_name
    };
  });
};

export const calculateTotalInventoryValue = (
  inventoryBalance: InventoryBalance[],
  products: Product[]
) => {
  return inventoryBalance.reduce((sum, item) => {
    // Use total_price directly from the inventory balance data if available
    // Fall back to calculating from product price if total_price is not available
    if (typeof item.total_price === 'number') {
      return sum + item.total_price;
    } else {
      const product = products.find(p => p.id === item.product_id);
      return sum + (item.total_quantity || 0) * (Number(product?.price || 0));
    }
  }, 0);
};

export const getInStockProductsCount = (inventoryBalance: InventoryBalance[]) => {
  return inventoryBalance.filter(item => item.total_quantity > 0).length;
};

export const getEntryCountsByType = (entries: InventoryEntry[]) => {
  return {
    totalInEntries: entries.filter(e => e.entry_type.includes('in')).length,
    totalOutEntries: entries.filter(e => e.entry_type.includes('out')).length,
  };
};

// New helper functions for inventory filtering and pagination

export const formatEntryType = (entryType: string): string => {
  return entryType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getEntryTypeColor = (entryType: string): string => {
  return entryType.includes('in') ? '#16a34a' : '#dc2626';
};

export const getEntryTypeBackgroundColor = (entryType: string): string => {
  return entryType.includes('in') ? '#dcfce7' : '#fee2e2';
};

export const enrichInventoryEntries = (
  entries: InventoryEntry[],
  users: User[]
): InventoryEntry[] => {
  return entries.map(entry => ({
    ...entry,
    username: entry.username || getUsernameById(entry.user_id, users)
  }));
};

export interface PaginationControls {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToPage: (page: number) => void;
}

export const usePagination = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
  setCurrentPage: (page: number) => void
): PaginationControls => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    const pageNumber = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(pageNumber);
  };
  
  return {
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToNextPage,
    goToPrevPage,
    goToPage
  };
};