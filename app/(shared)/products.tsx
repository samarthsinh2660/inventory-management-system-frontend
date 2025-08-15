import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Plus, Filter, X, Package, ChevronUp } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { IfMaster } from '../../components/IfMaster';
import { CategoryBadge } from '../../components/CategoryBadge';
import { fetchProducts, fetchProductById } from '../../store/slices/productsSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { fetchFormulas } from '../../store/slices/formulasSlice';
import { fetchPurchaseInfo } from '../../store/slices/purchaseInfoSlice';
import { fetchInventoryBalance } from '../../store/slices/inventorySlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ProductFiltersModal } from '@/components/modals/ProductFiltersModal';
import { CustomSearchBar } from '@/components/CustomSearchBar';
import { useDebounce } from '../../utils/helperFunctions';
import ProductDetailsModal from '../../components/modals/ProductDetailsModal';
import { Product, FilterState, ProductCategory, ProductSourceType, ProductSearchParams } from '@/types/product';
import { UserRole } from '@/types/user';

export default function Products() {
  const router = useRouter();
  const { refreshAll } = useLocalSearchParams<{ refreshAll?: string }>();
  const dispatch = useAppDispatch();
  const { list: products, loading, meta } = useAppSelector(state => state.products);
  const subcategories = useAppSelector(state => state.subcategories.list);
  const locations = useAppSelector(state => state.locations.list);
  const formulas = useAppSelector(state => state.formulas.list);
  const purchaseInfos = useAppSelector(state => state.purchaseInfo.list);
  const inventoryBalance = useAppSelector(state => state.inventory.balance);
  const user = useAppSelector(state => state.auth.user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef<FlatList<Product>>(null);
  const didProcessRefreshRef = useRef(false);
  const skipDefaultFetchOnceRef = useRef(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    subcategory_id: 0,
    location_id: 0,
    source_type: '',
    formula_id: 0,
    component_id: 0,
    purchase_info_id: 0,
  });

  const [quickFilters, setQuickFilters] = useState({
    category: '',
    subcategory_id: 0,
  });

  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isMaster = user?.role === UserRole.MASTER;

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  // Get current stock for a product from inventory balance
  const getProductStock = (productId: number) => {
    const balance = inventoryBalance.find(item => item.product_id === productId);
    return balance?.total_quantity || 0;
  };

  // Get price per unit for a product from inventory balance
  const getProductPricePerUnit = (productId: number) => {
    const balance = inventoryBalance.find(item => item.product_id === productId);
    return balance?.price_per_unit || 0;
  };

  // Get total value for a product from inventory balance
  const getProductTotalValue = (productId: number) => {
    const balance = inventoryBalance.find(item => item.product_id === productId);
    return balance?.total_price || 0;
  };

  // Helper function to get filtered subcategories based on selected category
  const getFilteredSubcategories = (selectedCategory: string) => {
    if (!selectedCategory) {
      return subcategories; // Return all subcategories if no category is selected
    }
    
    // Filter subcategories by category
    return subcategories.filter(subcategory => 
      subcategory.category === selectedCategory
    );
  };

  // Build search parameters for API call
  const buildSearchParams = (): ProductSearchParams => {
    const allFilters = {
      category: filters.category || quickFilters.category,
      subcategory_id: filters.subcategory_id || quickFilters.subcategory_id,
      location_id: filters.location_id,
      source_type: filters.source_type,
      formula_id: filters.formula_id,
      component_id: filters.component_id,
      purchase_info_id: filters.purchase_info_id,
    };

    const params: ProductSearchParams = {
      page: 1,
      limit: 50,
    };

    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (allFilters.category) params.category = allFilters.category as ProductCategory;
    if (allFilters.subcategory_id) params.subcategory_id = Number(allFilters.subcategory_id);
    if (allFilters.location_id) params.location_id = Number(allFilters.location_id);
    if (allFilters.source_type) params.source_type = allFilters.source_type as ProductSourceType;
    if (allFilters.formula_id) params.formula_id = Number(allFilters.formula_id);
    if (allFilters.component_id) params.component_id = Number(allFilters.component_id);
    if (allFilters.purchase_info_id) params.purchase_info_id = Number(allFilters.purchase_info_id);

    return params;
  };

  // Use products directly from Redux store (no client-side filtering)
  const filteredProducts = products;

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== 0
  ).length + Object.values(quickFilters).filter(value => 
    value !== '' && value !== 0
  ).length + (debouncedSearchTerm ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({
      category: '',
      subcategory_id: 0,
      location_id: 0,
      source_type: '',
      formula_id: 0,
      component_id: 0,
      purchase_info_id: 0,
    });
    setQuickFilters({
      category: '',
      subcategory_id: 0,
    });
    setSearchTerm('');
  };

  const setQuickFilter = (sourceType: string) => {
    setFilters(prev => {
      const newSourceType = prev.source_type === sourceType ? '' : sourceType;
      return {
        ...prev,
        source_type: newSourceType
      };
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const searchParams = buildSearchParams();
      await Promise.all([
        dispatch(fetchProducts(searchParams)),
        dispatch(fetchSubcategories()),
        dispatch(fetchLocations()),
        dispatch(fetchFormulas()),
        dispatch(fetchPurchaseInfo()),
        dispatch(fetchInventoryBalance()),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, debouncedSearchTerm, filters, quickFilters]);

  const handleProductUpdated = React.useCallback(async () => {
    // Refresh the products list and inventory
    const [productsResult] = await Promise.all([
      dispatch(fetchProducts({ page: 1, limit: 100 })).unwrap(),
      dispatch(fetchInventoryBalance())
    ]);
    
    // If a product is currently selected in the modal, update it with fresh data
    if (selectedProduct && selectedProduct.id && productsResult?.data) {
      const updatedProduct = productsResult.data.find((p: Product) => p.id === selectedProduct.id);
      
      if (updatedProduct) {
        // Calculate the current stock and total value for the updated product
        const currentStock = getProductStock(updatedProduct.id);
        const totalValue = getProductTotalValue(updatedProduct.id);
        
        // Update selectedProduct with the fresh data
        setSelectedProduct({
          ...updatedProduct,
          current_stock: currentStock,
          total_value: totalValue
        });
      }
    }
  }, [dispatch, selectedProduct, getProductStock, getProductTotalValue]);

  useEffect(() => {
    dispatch(fetchSubcategories());
    dispatch(fetchLocations());
    dispatch(fetchFormulas());
    dispatch(fetchPurchaseInfo());
    dispatch(fetchInventoryBalance());
  }, [dispatch]);

  useEffect(() => {
    // If we are expecting a full refresh via refreshAll, skip this default fetch once
    if (refreshAll === '1' && !didProcessRefreshRef.current) return;
    if (skipDefaultFetchOnceRef.current) {
      skipDefaultFetchOnceRef.current = false;
      return;
    }
    const searchParams = buildSearchParams();
    dispatch(fetchProducts(searchParams));
  }, [dispatch, debouncedSearchTerm, filters, quickFilters]);

  // If navigated with refreshAll=1 (after creating a product), clear filters/search and fetch full list once
  useEffect(() => {
    if (refreshAll === '1' && !didProcessRefreshRef.current) {
      didProcessRefreshRef.current = true;
      // We'll clear local filters/search which would normally trigger the default fetch.
      // Mark to skip the next default fetch so only the explicit 100-limit fetch runs.
      skipDefaultFetchOnceRef.current = true;
      setFilters({
        category: '',
        subcategory_id: 0,
        location_id: 0,
        source_type: '',
        formula_id: 0,
        component_id: 0,
        purchase_info_id: 0,
      });
      setQuickFilters({ category: '', subcategory_id: 0 });
      setSearchTerm('');
      dispatch(fetchProducts({ page: 1, limit: 100 }));
    }
  }, [refreshAll, dispatch]);

  const renderProduct = ({ item }: { item: Product }) => {
    const currentStock = getProductStock(item.id);
    const pricePerUnit = getProductPricePerUnit(item.id);
    const totalValue = getProductTotalValue(item.id);
    const isLowStock = currentStock < (item.min_stock_threshold || 0);
    const isOutOfStock = currentStock === 0;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          const completeProductData = {
            ...item,  // All basic product info from the list
            current_stock: currentStock,
            total_value: totalValue
          };
          
          setSelectedProduct(completeProductData);
          setShowProductDetails(true);
        }}
      >
        {/* Product Header - Title with stock status and category */}
        <View style={styles.productHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.statusCategoryContainer}>
            <CategoryBadge category={item.category} />
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: isOutOfStock ? '#fef2f2' : isLowStock ? '#fef3c7' : '#f0fdf4'
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  {
                    color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#16a34a'
                  }
                ]}>
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Product Details - Compact side by side layout */}
        <View style={styles.productDetails}>
          <View style={styles.detailRowCompact}>
            <View style={styles.detailColumn}>
              <View style={styles.inlineDetail}>
                <Text style={styles.detailLabel}>Current Stock:</Text>
                <Text style={[
                  styles.detailValue,
                  styles.inlineValue,
                  { color: isOutOfStock ? '#dc2626' : isLowStock ? '#f59e0b' : '#16a34a' }
                ]}>
                  {currentStock} {item.unit}
                </Text>
              </View>
            </View>
            <View style={styles.detailColumn}>
              <View style={styles.inlineDetail}>
                <Text style={styles.detailLabel}>Min Threshold:</Text>
                <Text style={[styles.detailValue, styles.inlineValue]}>{item.min_stock_threshold || 0} {item.unit}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRowCompact}>
   <View style={styles.detailColumnPrice}> 
    <View style={styles.inlineDetail}>
      <Text style={styles.detailLabel}>Price/Unit:</Text>
      <Text style={[styles.priceText, styles.inlineValue]} numberOfLines={1}>
        ₹{pricePerUnit.toFixed(2)}
      </Text>
    </View>
  </View>
  <View style={styles.detailColumnSource}> 
    <View style={styles.sourceDetailContainer}>
      <Text style={styles.sourceLabel}>Source:</Text>
      <Text style={styles.sourceText} numberOfLines={1}>
        {item.source_type === 'manufacturing' ? 'Manufacturing' : 'Trading'}
      </Text>
    </View>
  </View>
</View>
        </View>

        {/* Product Footer - Subcategory left, Location right */}
        <View style={styles.productFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.subcategoryText}>
              📂 {subcategories.find(sub => sub.id === item.subcategory_id)?.name || 'No Subcategory'}
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.productLocation}>
              📍 {locations.find(loc => loc.id === item.location_id)?.name || 'No Location'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Categories definition for dropdowns
  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Raw Materials', value: ProductCategory.RAW },
    { label: 'Finished Products', value: ProductCategory.FINISHED },
    { label: 'Semi-Finished Products', value: ProductCategory.SEMI },
  ];

  // Memoized header component to prevent re-renders and maintain TextInput focus
  const renderHeader = useMemo(() => (
    <View style={styles.headerComponent}>
      {/* Search Bar Section */}
      <View style={styles.searchContainer}>
        <CustomSearchBar
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={handleSearchChange}
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

      {/* Quick Filters Section */}
      <View style={styles.quickFiltersContainer}>
        <Text style={styles.quickFiltersLabel}>Quick Filters:</Text>
        
        {/* Category and Subcategory Dropdowns Full Width */}
        <View style={styles.dropdownFullWidth}>
          <View style={styles.dropdownItemFullWidth}>
            <Text style={styles.dropdownLabel}>Category</Text>
            <View style={styles.quickFilterDropdownFullWidth}>
              <Picker
                selectedValue={quickFilters.category}
                onValueChange={(value) => setQuickFilters(prev => ({ 
                  ...prev, 
                  category: value,
                  // Reset subcategory when category changes
                  subcategory_id: 0
                }))}
                style={styles.quickPickerFullWidth}
                itemStyle={styles.pickerItemFullWidth}
              >
                {categories.map((category) => (
                  <Picker.Item key={category.value} label={category.label} value={category.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.dropdownItemFullWidth}>
            <Text style={styles.dropdownLabel}>Subcategory</Text>
            <View style={styles.quickFilterDropdownFullWidth}>
              <Picker
                selectedValue={quickFilters.subcategory_id}
                onValueChange={(value) => setQuickFilters(prev => ({ ...prev, subcategory_id: Number(value) }))}
                style={styles.quickPickerFullWidth}
                itemStyle={styles.pickerItemFullWidth}
              >
                <Picker.Item label="All Subcategories" value={0} />
                {getFilteredSubcategories(quickFilters.category || filters.category).map((subcategory) => (
                  <Picker.Item
                    key={subcategory.id}
                    label={subcategory.name}
                    value={subcategory.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Source Type Quick Filters Full Width */}
        <View style={styles.quickFiltersFullWidth}>
          <Text style={styles.sourceTypeLabel}>Source Type:</Text>
          <View style={styles.sourceTypeButtons}>
            <TouchableOpacity
              style={[
                styles.quickFilterButtonFullWidth,
                filters.source_type === ProductSourceType.MANUFACTURING && styles.quickFilterButtonActiveFullWidth
              ]}
              onPress={() => setQuickFilter('manufacturing')}
            >
              <Text style={[
                styles.quickFilterTextFullWidth,
                filters.source_type === ProductSourceType.MANUFACTURING && styles.quickFilterTextActiveFullWidth
              ]}>
                Manufacturing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickFilterButtonFullWidth,
                filters.source_type === ProductSourceType.TRADING && styles.quickFilterButtonActiveFullWidth
              ]}
              onPress={() => setQuickFilter('trading')}
            >
              <Text style={[
                styles.quickFilterTextFullWidth,
                filters.source_type === ProductSourceType.TRADING && styles.quickFilterTextActiveFullWidth
              ]}>
                Trading
              </Text>
            </TouchableOpacity>
            {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersButtonFullWidth}
              onPress={clearAllFilters}
            >
              <X size={16} color="#ef4444" />
              <Text style={styles.clearFiltersTextFullWidth}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
          </View>
        </View>
      </View>
    </View>
  ), [searchTerm, activeFiltersCount, quickFilters, filters, categories, subcategories, getFilteredSubcategories, handleSearchChange, setSearchTerm, setShowFilters, setQuickFilters, setQuickFilter, clearAllFilters]);

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
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

      {/* Search bar now back in FlatList header with useMemo to prevent focus loss */}

      {/* Non-blocking loading overlay to keep inputs mounted */}
      {loading && !refreshing && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <LoadingSpinner />
        </View>
      )}

      {/* FlatList with memoized scrollable header */}
      <FlatList
        ref={flatListRef}
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderHeader}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setShowScrollToTop(offsetY > 120);
        }}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color="#d1d5db" />
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
        purchaseInfos={purchaseInfos}
        products={products}
      />

      <ProductDetailsModal
        visible={showProductDetails}
        onClose={() => setShowProductDetails(false)}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity 
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <ChevronUp size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
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
    paddingVertical: 8, 
    backgroundColor: 'white',
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb',
  },
  headerComponent: {
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 0, 
    paddingVertical: 0, 
    borderBottomWidth: 0,
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
    paddingHorizontal: 0, // Keep some padding from screen edges
    paddingVertical: 4,
    gap: 8,
    backgroundColor: '#f8fafc', // Change from 'white' to match main background
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
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
    paddingHorizontal: 0, // Keep some padding from screen edges  
    paddingVertical: 2,
    backgroundColor: '#f8fafc', // Change from '#f9fafb' to match main background
    borderBottomWidth: 0, // Change from 1 to 0 to remove border
    borderBottomColor: '#e5e7eb',
  },
  quickFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  dropdownItem: {
    flex: 1,
  },
  quickFilterContainer: {
    marginBottom: 12,
  },
  quickFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  quickFilterDropdown: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 60,
    justifyContent: 'center',
  },
  quickPicker: {
    height: 60,
  },
  pickerItem: {
    fontSize: 14,
    height: 60,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  quickFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  quickFilterTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    minHeight: 40,
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  sourceType: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  sourceTypeSmall: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
    marginLeft: 4,
  },
  priceSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineValue: {
    marginLeft: 2,
  },
  sourceText: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '600',
    flexShrink: 0,
    minWidth: 70,
  },
  sourceDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    flex: 1,
    minWidth: 100,
  },
  sourceLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    flexShrink: 0,
  },
  subcategoryText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  productDetails: {
    gap: 6,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailColumn: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 8,
    minWidth: 0,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    flexShrink: 1,
  },
  detailColumnPrice: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 8,
    minWidth: 0,
    maxWidth: '60%',
  },
  
  detailColumnSource: {
    flex: 0,
    alignItems: 'flex-start',
    paddingRight: 8,
    minWidth: 100,
  },
  
  
  detailLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 6,
  },
  footerLeft: {
    alignItems: 'flex-start',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  productLocation: {
    fontSize: 10,
    color: '#6b7280',
  },
  productSubcategory: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  createFirstButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Glossy effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownFullWidth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 2,
  },
  dropdownItemFullWidth: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  quickFilterDropdownFullWidth: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 40,
    justifyContent: 'center',
  },
  quickPickerFullWidth: {
    height: 70,
  },
  pickerItemFullWidth: {
    fontSize: 12,
    height: 40,
  },
  quickFiltersFullWidth: {
    marginTop: 4,
    marginBottom: 8,
  },
  sourceTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sourceTypeButtons: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  quickFilterButtonFullWidth: {
    paddingHorizontal: 8, // Change from 12 to 8
    paddingVertical: 6, // Change from 8 to 6
    borderRadius: 12, // Change from 16 to 12
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
    minHeight: 28, // Change from 32 to 28
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  quickFilterButtonActiveFullWidth: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  quickFilterTextFullWidth: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  quickFilterTextActiveFullWidth: {
    color: '#2563eb',
    fontWeight: '600',
  },
  clearFiltersButtonFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // Change from 3 to 2
    paddingHorizontal: 6, // Change from 8 to 6
    paddingVertical: 4, // Change from 6 to 4
    borderRadius: 10, // Change from 12 to 10
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    minHeight: 28, // Change from 32 to 28
    marginTop: 0,
    marginLeft: 8,
  }, 
  clearFiltersTextFullWidth: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});