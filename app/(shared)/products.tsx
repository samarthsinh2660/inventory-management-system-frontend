import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Filter, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { IfMaster } from '../../components/IfMaster';
import { CategoryBadge } from '../../components/CategoryBadge';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { fetchFormulas } from '../../store/slices/formulasSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ProductFiltersModal } from '@/components/modals/ProductFiltersModal';
import { CustomSearchBar } from '@/components/CustomSearchBar';
import ProductDetailsModal from '../../components/modals/ProductDetailsModal';

interface FilterState {
  category: string;
  subcategory_id: number;
  location_id: number;
  source_type: string;
  formula_id: number;
}

export default function Products() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list: products, loading } = useAppSelector(state => state.products);
  const subcategories = useAppSelector(state => state.subcategories.list);
  const locations = useAppSelector(state => state.locations.list);
  const formulas = useAppSelector(state => state.formulas.list);
  const user = useAppSelector(state => state.auth.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    subcategory_id: 0,
    location_id: 0,
    source_type: '',
    formula_id: 0,
  });

  const isMaster = user?.role === 'master';

  const handleSearChange = (text: string) => {
    setSearchTerm(text);
  };

  const applyFilters = (product: any) => {
    // Search term filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Category filter
    if (filters.category && product.category !== filters.category) return false;
    
    // Subcategory filter
    if (filters.subcategory_id && product.subcategory_id !== filters.subcategory_id) return false;
    
    // Location filter
    if (filters.location_id && product.location_id !== filters.location_id) return false;
    
    // Source type filter
    if (filters.source_type && product.source_type !== filters.source_type) return false;
    
    // Formula filter
    if (filters.formula_id && product.product_formula_id !== filters.formula_id) return false;

    return true;
  };

  const filteredProducts = products.filter(applyFilters);

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== 0
  ).length;

  const clearAllFilters = () => {
    setFilters({
      category: '',
      subcategory_id: 0,
      location_id: 0,
      source_type: '',
      formula_id: 0,
    });
  };

  const setQuickFilter = (sourceType: string) => {
    setFilters(prev => ({
      ...prev,
      source_type: prev.source_type === sourceType ? '' : sourceType
    }));
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchProducts({ page: 1, limit: 20 })), // Increased limit to show more products
        dispatch(fetchSubcategories()),
        dispatch(fetchLocations()),
        dispatch(fetchFormulas()),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const handleProductUpdated = React.useCallback(() => {
    // Refresh the products list to show updated data
    dispatch(fetchProducts({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    // Load products with higher limit initially
    dispatch(fetchProducts({ page: 1, limit: 50 }));
    dispatch(fetchSubcategories());
    dispatch(fetchLocations());
    dispatch(fetchFormulas());
  }, [dispatch]);

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => {
        setSelectedProduct(item);
        setShowProductDetails(true);
      }}
    >
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productUnit}>{item.unit}</Text>
        </View>
        <View style={styles.statusContainer}>
          <CategoryBadge category={item.category} />
          {/* Stock Status Indicator */}
          <View style={[
            styles.stockIndicator,
            {
              backgroundColor: (item.current_stock || 0) < (item.min_stock_threshold || 0) 
                ? '#fef2f2' 
                : (item.current_stock || 0) === 0 
                  ? '#f3f4f6' 
                  : '#f0fdf4'
            }
          ]}>
            <Text style={[
              styles.stockIndicatorText,
              {
                color: (item.current_stock || 0) < (item.min_stock_threshold || 0) 
                  ? '#dc2626' 
                  : (item.current_stock || 0) === 0 
                    ? '#6b7280' 
                    : '#16a34a'
              }
            ]}>
              {(item.current_stock || 0) < (item.min_stock_threshold || 0) 
                ? 'Low Stock' 
                : (item.current_stock || 0) === 0 
                  ? 'Out of Stock' 
                  : 'In Stock'
              }
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cost:</Text>
          <Text style={styles.detailValue}>₹{item.price}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={[
            styles.detailValue,
            (item.current_stock || 0) < (item.min_stock_threshold || 0) && styles.lowStock
          ]}>
            {item.current_stock || 0} {item.unit}
          </Text>
        </View>
        {item.min_stock_threshold && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min Threshold:</Text>
            <Text style={styles.detailValue}>{item.min_stock_threshold} {item.unit}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Source:</Text>
          <Text style={[styles.detailValue, styles.sourceType]}>
            {item.source_type === 'manufacturing' ? 'Manufacturing' : 'Trading'}
          </Text>
        </View>
        {/* Display formula information if available */}
        {item.formula_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Formula:</Text>
            <Text style={[styles.detailValue, styles.formulaName]}>
              {item.formula_name}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.productFooter}>
        <Text style={styles.subcategoryText}>{item.subcategory_name}</Text>
        <Text style={styles.locationText}>{item.location_name}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} 
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied)`}
          </Text>
        </View>
        <IfMaster>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/create-product')}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </IfMaster>
      </View>

      <View style={styles.searchContainer}>
        <CustomSearchBar
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={handleSearChange}
          onClear={() => setSearchTerm('')}
        />
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={activeFiltersCount > 0 ? "#2563eb" : "#6b7280"} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFiltersContainer}>
        <Text style={styles.quickFiltersLabel}>Quick Filters:</Text>
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              filters.source_type === 'manufacturing' && styles.quickFilterButtonActive
            ]}
            onPress={() => setQuickFilter('manufacturing')}
          >
            <Text style={[
              styles.quickFilterText,
              filters.source_type === 'manufacturing' && styles.quickFilterTextActive
            ]}>
              Manufacturing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              filters.source_type === 'trading' && styles.quickFilterButtonActive
            ]}
            onPress={() => setQuickFilter('trading')}
          >
            <Text style={[
              styles.quickFilterText,
              filters.source_type === 'trading' && styles.quickFilterTextActive
            ]}>
              Trading
            </Text>
          </TouchableOpacity>
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <X size={16} color="#ef4444" />
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchTerm || activeFiltersCount > 0 ? 'No products match your search' : 'No products found'}
            </Text>
            {(searchTerm || activeFiltersCount > 0) && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchTerm('');
                  clearAllFilters();
                }}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search & Filters</Text>
              </TouchableOpacity>
            )}
            <IfMaster>
              {!searchTerm && activeFiltersCount === 0 && (
                <TouchableOpacity 
                  style={styles.createFirstButton}
                  onPress={() => router.push('/create-product')}
                >
                  <Text style={styles.createFirstButtonText}>Create First Product</Text>
                </TouchableOpacity>
              )}
            </IfMaster>
          </View>
        }
      />

      <ProductFiltersModal
        isVisible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={setFilters}
        subcategories={subcategories}
        locations={locations}
        formulas={formulas}
      />

      <ProductDetailsModal
        visible={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
    flex: 1,
  },
  searchBarInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 40,
  },
  searchBarText: {
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  quickFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  quickFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quickFilterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  quickFilterTextActive: {
    color: 'white',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  productDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  sourceType: {
    textTransform: 'capitalize',
  },
  lowStock: {
    color: '#dc2626',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  subcategoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stockIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearSearchButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  createFirstButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  formulaName: {
    textTransform: 'capitalize',
  },
});