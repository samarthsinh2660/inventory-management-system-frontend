import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Package, Plus, TrendingUp, TrendingDown, ChartBar as BarChart3, ChevronLeft, ChevronRight, Filter, X, Search, ChevronUp } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { createInventoryEntry, fetchInventoryBalance, fetchInventoryEntries, fetchUserEntries, searchInventoryEntries, setFilters, clearFilters, setSearchTerm } from '../../store/slices/inventorySlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import Toast from 'react-native-toast-message';
import {
  formatEntryType,
  getEntryTypeColor,
  getEntryTypeBackgroundColor,
  usePagination,
  useDebounce
} from '../../utils/helperFunctions';
import InventoryEntryDetailsModal from '../../components/modals/InventoryEntryDetailsModal';
import { InventoryFiltersModal } from '../../components/inventory/InventoryFiltersModal';
import { CustomSearchBar } from '../../components/CustomSearchBar';
import { UserRole } from '@/types/user';
import { 
  InventoryEntryType, 
  InventoryEntry,
  CreateInventoryEntryData ,
  InventoryFormValues,
  EntryItemProps
} from '@/types/inventory';
import { ProductCategory, ProductSourceType } from '@/types/product';
import { ViewMode } from '@/types/general';

const validationSchema = Yup.object({
  product_id: Yup.number().min(1, 'Product is required').required('Product is required'),
  quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
  entry_type: Yup.string().required('Entry type is required'),
  location_id: Yup.number().min(1, 'Location is required').required('Location is required'),
  notes: Yup.string(),
  reference_id: Yup.string(), // Optional reference_id field
});

export default function InventoryScreen() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.products.list || []);
  const locations = useAppSelector(state => state.locations.list || []);
  const subcategories = useAppSelector(state => state.subcategories.list || []);
  const { 
    entries: allEntries = [], 
    userEntries = [], 
    loading, 
    meta = { total: 0, pages: 0 }, 
    balance = [],
    filters
  } = useAppSelector(state => state.inventory);
  const users = useAppSelector(state => state.users.list || []);
  const user = useAppSelector(state => state.auth.user);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<InventoryEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef<FlatList<InventoryEntry>>(null);
  
  // Product filter states
  const [productFilters, setProductFilters] = useState({
    sourceType: '',
    category: '',
    subcategoryId: 0,
  });

  const itemsPerPage = 100;

  const isMaster = user?.role === UserRole.MASTER;
  const entries = viewMode === 'all' ? allEntries : userEntries;
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Calculate active filters count
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'number') return value !== undefined && value > 0;
    return value !== undefined && value !== null;
  }).length;
 
  
  const pagination = usePagination(
    currentPage, 
    meta.total || 0, 
    itemsPerPage, 
    setCurrentPage
  );

  // Search functionality
  const performSearch = useCallback(() => {
    const searchFilters = {
      ...filters,
      search: debouncedSearchTerm,
      page: 1, // Reset to first page when searching
    };
    dispatch(searchInventoryEntries(searchFilters));
  }, [dispatch, filters, debouncedSearchTerm]);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
    setCurrentPage(1);
    // Reload entries with cleared filters
    setTimeout(() => {
      loadEntries();
    }, 100);
  };

  const handleApplyFilters = (newFilters: any) => {
    dispatch(setFilters(newFilters));
    setCurrentPage(1);
    // Perform search with new filters
    const searchFilters = {
      ...newFilters,
      search: searchTerm,
      page: 1,
    };
    dispatch(searchInventoryEntries(searchFilters));
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };



  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Comprehensive refresh of all inventory data
    Promise.all([
      dispatch(fetchInventoryBalance()),
      dispatch(fetchProducts({ page: 1, limit: 100 })), // Fetch more products to ensure all are available
      dispatch(fetchLocations()),
      dispatch(fetchSubcategories()),
      loadEntries(),
      // Also refresh user entries if user exists
      user ? dispatch(fetchUserEntries({ page: 1, limit: itemsPerPage })) : Promise.resolve()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch, user, itemsPerPage]);

  useEffect(() => {
    // Initial data load - only once on mount
    dispatch(fetchProducts({ page: 1, limit: 100 }));
    dispatch(fetchLocations());
    dispatch(fetchSubcategories());
    dispatch(fetchUsers());
    dispatch(fetchInventoryBalance());
    
    // Load initial entries based on viewMode
    const params = { page: 1, limit: itemsPerPage };
    if (viewMode === 'all') {
      dispatch(fetchInventoryEntries(params));
    } else {
      dispatch(fetchUserEntries(params));
    }
  }, [dispatch, itemsPerPage]);

  // Only reload entries when viewMode changes, not on every currentPage change
  useEffect(() => {
    if (currentPage === 1) { // Only reload on viewMode change, not pagination
      loadEntries();
    }
  }, [viewMode]);

  useEffect(() => {
    if (selectedProductId > 0) {
      // We already have balance data fetched on component mount
      // No need for additional stock fetching
    }
  }, [selectedProductId, dispatch]);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      const searchFilters = {
        ...filters,
        search: debouncedSearchTerm,
        page: 1, // Reset to first page when searching
      };
      dispatch(searchInventoryEntries(searchFilters));
    }
  }, [debouncedSearchTerm, filters, dispatch]);



  const loadEntries = () => {
    const params = { page: currentPage, limit: itemsPerPage };
    
    if (viewMode === 'all') {
      dispatch(fetchInventoryEntries(params));
    } else {
      // Make sure to fetch user entries from the correct endpoint
      dispatch(fetchUserEntries(params));
    }
  };

  // Function to load more entries for infinite scroll
  const loadMoreEntries = () => {
    const nextPage = currentPage + 1;
    const params = { page: nextPage, limit: itemsPerPage };
    
    if (viewMode === 'all') {
      dispatch(fetchInventoryEntries(params));
    } else {
      dispatch(fetchUserEntries(params));
    }
    setCurrentPage(nextPage);
  };






  // Function to toggle between all entries and user entries
  const toggleViewMode = () => {
    const newMode = viewMode === 'all' ? 'mine' : 'all';
    setViewMode(newMode);
    setCurrentPage(1); // Reset to first page when changing views
  };

  // Helper function to get filtered subcategories based on selected category
  const getFilteredSubcategories = (selectedCategory: string) => {
    if (!selectedCategory) {
      return subcategories; // Return all subcategories if no category is selected
    }
    
    // Get unique subcategory IDs that are used by products in the selected category
    const categoryProductSubcategoryIds = new Set(
      products
        .filter(product => product.category === selectedCategory)
        .map(product => product.subcategory_id)
    );
    
    // Return only subcategories that are actually used by products in this category
    return subcategories.filter(subcategory => 
      categoryProductSubcategoryIds.has(subcategory.id)
    );
  };

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    // Filter by source type
    if (productFilters.sourceType && product.source_type !== productFilters.sourceType) {
      return false;
    }
    
    // Filter by category
    if (productFilters.category && product.category !== productFilters.category) {
      return false;
    }
    
    // Filter by subcategory - convert to number for comparison
    if (productFilters.subcategoryId > 0 && product.subcategory_id !== Number(productFilters.subcategoryId)) {
      return false;
    }
    
    return true;
  });

  // Handle filter changes
  const handleSourceTypeChange = (value: string) => {
    setProductFilters(prev => ({
      ...prev,
      sourceType: value,
      // Reset product selection when filter changes
    }));
    setSelectedProductId(0);
  };

  const handleCategoryChange = (value: string) => {
    setProductFilters(prev => ({
      ...prev,
      category: value,
      // Reset subcategory when category changes to ensure compatibility
      subcategoryId: 0,
    }));
    setSelectedProductId(0);
  };

  const handleSubcategoryChange = (value: number) => {
    setProductFilters(prev => ({
      ...prev,
      subcategoryId: Number(value),
    }));
    setSelectedProductId(0);
  };

  // Reset all filters
  const resetFilters = () => {
    setProductFilters({
      sourceType: '',
      category: '',
      subcategoryId: 0,
    });
    setSelectedProductId(0);
  };

  const handleSubmit = async (
    values: InventoryFormValues, 
    { resetForm }: { resetForm: () => void }
  ) => {
    try {
      const entryData: CreateInventoryEntryData = {
        product_id: values.product_id,
        quantity: parseFloat(values.quantity),
        entry_type: values.entry_type,
        location_id: values.location_id,
        notes: values.notes || undefined,
        reference_id: values.reference_id || undefined,
      };

      await dispatch(createInventoryEntry(entryData)).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Inventory entry created successfully',
      });
      resetForm();
      setSelectedProductId(0);
      setShowEntryForm(false);
      
      // Refresh both the entries and the balance data after a successful entry
      loadEntries();
      dispatch(fetchInventoryBalance());
    } catch (error: any) {
      // Prefer showing the backend-provided message
      let message = 'Failed to create inventory entry';
      if (typeof error === 'string') {
        message = error;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  // Find the current stock for the selected product from the balance data
  const selectedProductStock = selectedProductId > 0 
    ? balance.find(item => item.product_id === selectedProductId)?.total_quantity || 0
    : 0;

  const recentEntries = entries.slice(0, 10);

  const EntryItem = ({ entry }: EntryItemProps) => {
    const displayUsername = entry.username || 'Unknown User';

    // Format date as dd-mm-yy
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Unknown Date';
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };

    return (
      <TouchableOpacity 
        style={[
          styles.entryItem,
          { borderLeftWidth: 4, borderLeftColor: getEntryTypeColor(entry.entry_type) }
        ]}
        onPress={() => {
          setSelectedEntry(entry);
          setShowEntryDetails(true);
        }}
      >
        <View style={[styles.entryIcon, { 
          backgroundColor: getEntryTypeBackgroundColor(entry.entry_type)
        }]}>
          {entry.entry_type && entry.entry_type.includes('in') ? (
            <TrendingUp size={16} color={getEntryTypeColor(entry.entry_type)} />
          ) : (
            <TrendingDown size={16} color={getEntryTypeColor(entry.entry_type)} />
          )}
        </View>
        <View style={styles.entryContent}>
          <Text style={styles.entryProduct}>{entry.product_name || 'Unknown Product'}</Text>
          <Text style={styles.entryDetails}>
            {formatEntryType(entry.entry_type) || 'Unknown Type'}: {Math.abs(entry.quantity || 0)} units
          </Text>
          <View style={styles.entryFooter}>
            <Text style={styles.entryTime}>
              {formatDate(entry.created_at)} • {entry.location_name || 'Unknown Location'}
            </Text>
            {isMaster && (
              <Text style={styles.entryUser}>by {displayUsername}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (showEntryForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowEntryForm(false)} style={styles.backButtonContainer}>
            <ChevronLeft size={24} color="#2563eb" />
            </TouchableOpacity>
          <Text style={styles.title}>New Inventory Entry</Text>
          <View style={styles.headerRight}>
            {/* Empty view for balanced layout */}
          </View>
        </View>
        <ScrollView style={styles.form}>
          <Formik
            initialValues={{
              product_id: selectedProductId || 0,
              quantity: '',
              entry_type: InventoryEntryType.MANUAL_IN,
              location_id: 0,
              notes: '',
              reference_id: '', // Added reference_id initial value
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                {/* Product Filters Section */}
                {/* Compact Product Filters Section */}
                <View style={styles.filtersSection}>
                  <View style={styles.filtersSectionHeader}>
                    <Text style={styles.filtersSectionTitle}>Product Filters</Text>
                    <View style={styles.filterActions}>
                      <TouchableOpacity onPress={resetFilters} style={styles.resetFiltersButton}>
                        <Text style={styles.resetFiltersText}>Reset</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addFilterButton}>
                        <Plus size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Side-by-side filters */}
                  <View style={styles.filtersRow}>
                    <View style={styles.filterColumn}>
                      <Text style={styles.label}>Source Type</Text>
                      <View style={styles.picker}>
                        <Picker
                          selectedValue={productFilters.sourceType}
                          onValueChange={handleSourceTypeChange}
                        >
                          <Picker.Item label="All Source Types" value="" />
                          <Picker.Item label="Manufacturing" value={ProductSourceType.MANUFACTURING} />
                          <Picker.Item label="Trading" value={ProductSourceType.TRADING} />
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.filterColumn}>
                      <Text style={styles.label}>Category</Text>
                      <View style={styles.picker}>
                        <Picker
                          selectedValue={productFilters.category}
                          onValueChange={handleCategoryChange}
                        >
                          <Picker.Item label="All Categories" value="" />
                          <Picker.Item label="Raw Materials" value={ProductCategory.RAW} />
                          <Picker.Item label="Semi-Finished" value={ProductCategory.SEMI} />
                          <Picker.Item label="Finished Products" value={ProductCategory.FINISHED} />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <View style={styles.filtersRow}>
                    <View style={styles.filterColumn}>
                      <Text style={styles.label}>Subcategory</Text>
                      <View style={styles.picker}>
                        <Picker
                          selectedValue={productFilters.subcategoryId}
                          onValueChange={handleSubcategoryChange}
                          key={`subcategory-${productFilters.category}`}
                        >
                          <Picker.Item label="All Subcategories" value={0} />
                          {getFilteredSubcategories(productFilters.category).length > 0 ? (
                            getFilteredSubcategories(productFilters.category).map(subcategory => (
                              <Picker.Item 
                                key={subcategory.id} 
                                label={subcategory.name || 'Unknown Subcategory'} 
                                value={subcategory.id} 
                              />
                            ))
                          ) : (
                            <Picker.Item label="No subcategories available" value={0} />
                          )}
                        </Picker>
                      </View>
                    </View>
                  </View>
                  
                  {/* Compact product count indicator */}
                  <View style={styles.productCountIndicator}>
                    <Text style={styles.productCountText}>
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                    </Text>
                  </View>
                </View>

                {/* Product Selection */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Product</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={values.product_id}
                      onValueChange={(itemValue) => {
                        setFieldValue('product_id', itemValue);
                        setSelectedProductId(Number(itemValue));
                      }}
                    >
                      <Picker.Item label="Select a product" value={0} />
                      {filteredProducts.map(product => (
                        <Picker.Item key={product.id} label={product.name || 'Unknown Product'} value={product.id} />
                      ))}
                    </Picker>
                  </View>
                  {errors.product_id && touched.product_id && (
                    <Text style={styles.errorText}>{errors.product_id}</Text>
                  )}
                </View>

                {selectedProduct && (
                  <View style={styles.productInfo}>
                    <Text style={styles.stockText}>
                      {(selectedProduct.name || 'Unknown Product')} — Avail: {selectedProductStock || 0}
                      {selectedProduct.unit && selectedProduct.unit.toLowerCase() !== 'no.' ? ` ${selectedProduct.unit}` : ''},
                      {' '}Min: {selectedProduct.min_stock_threshold || 0}
                      {selectedProduct.unit && selectedProduct.unit.toLowerCase() !== 'no.' ? ` ${selectedProduct.unit}` : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Entry Type</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={values.entry_type}
                      onValueChange={handleChange('entry_type')}
                    >
                      <Picker.Item label="Purchase In" value={InventoryEntryType.MANUAL_IN} />
                      <Picker.Item label="Removed" value={InventoryEntryType.MANUAL_OUT} />
                      <Picker.Item label="Manufacturing In" value={InventoryEntryType.MANUFACTURING_IN} />
                    </Picker>
                  </View>
                  {errors.entry_type && touched.entry_type && (
                    <Text style={styles.errorText}>{String(errors.entry_type)}</Text>
                  )}
                </View>

                <TextInput
                  label="Quantity"
                  value={values.quantity}
                  onChangeText={handleChange('quantity')}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                />
                {errors.quantity && touched.quantity && (
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                )}

                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={values.location_id?.toString() || '0'}
                      onValueChange={(itemValue) => {
                        // Fix for type issue - convert string to number
                        const numValue = itemValue === '0' ? 0 : Number(itemValue);
                        setFieldValue('location_id', numValue);
                      }}
                    >
                      <Picker.Item label="Select a location" value={'0'} />
                      {locations.map(location => (
                        <Picker.Item key={location.id} label={location.name || 'Unknown Location'} value={location.id.toString()} />
                      ))}
                    </Picker>
                  </View>
                  {errors.location_id && touched.location_id && (
                    <Text style={styles.errorText}>{String(errors.location_id)}</Text>
                  )}
                </View>

                <TextInput
                  label="Notes (Optional)"
                  value={values.notes}
                  onChangeText={handleChange('notes')}
                  mode="outlined"
                  style={styles.input}
                  multiline
                />

                {/* Add reference_id (referral ID) field */}
                <TextInput
                  label="Referral ID (Optional)"
                  value={values.reference_id || ''}
                  onChangeText={handleChange('reference_id')}
                  mode="outlined"
                  style={styles.input}
                />

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={styles.submitButton}
                    contentStyle={styles.buttonContent}
                    onPress={() => handleSubmit()}
                  >
                    Create Entry
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <View style={styles.headerButtons}>
          {/* Audit Log Toggle Button */}
          <TouchableOpacity 
            style={[styles.logToggleButton, viewMode === 'mine' && styles.logToggleButtonActive]} 
            onPress={toggleViewMode}
          >
            <View style={styles.logToggleContent}>
              <BarChart3 size={16} color={viewMode === 'mine' ? '#2563eb' : '#6b7280'} />
              <Text style={[styles.logToggleText, viewMode === 'mine' && styles.logToggleTextActive]}>
                {viewMode === 'all' ? 'All Entries' : 'My Entries'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={() => setShowEntryForm(true)}>
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Section - Fixed above FlatList */}
      <View style={styles.searchContainer}>
        <CustomSearchBar
          placeholder="Search inventory entries..."
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

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
          <View style={styles.activeFiltersRow}>
            {searchTerm && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Search</Text>
              </View>
            )}
            {filters.entry_type && filters.entry_type.trim() !== '' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Entry Type</Text>
              </View>
            )}
            {Number(filters.user_id) > 0 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>User</Text>
              </View>
            )}
            {Number(filters.location_id) > 0 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Location</Text>
              </View>
            )}
            {Number(filters.product_id) > 0 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Product</Text>
              </View>
            )}
            {filters.category && filters.category.trim() !== '' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Category</Text>
              </View>
            )}
            {Number(filters.subcategory_id) > 0 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Subcategory</Text>
              </View>
            )}
            {filters.reference_id && filters.reference_id.trim() !== '' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Reference ID</Text>
              </View>
            )}
            {Boolean(filters.date_from || filters.date_to || (Number(filters.days) > 0)) && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Date Range</Text>
              </View>
            )}
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
              <X size={14} color="#ef4444" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

  <FlatList
    ref={flatListRef}
    data={entries.filter(item => item && item.id)}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => <EntryItem entry={item} />}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    onScroll={(event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollToTop(offsetY > 200);
    }}
    scrollEventThrottle={16}
    ListHeaderComponent={() => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {viewMode === 'all' ? 'All Inventory Entries' : 'My Inventory Entries'}
        </Text>
      </View>
    )}
    ListEmptyComponent={() => (
      <View style={styles.emptyContainer}>
        <Package size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>
          {viewMode === 'all' ? 'No inventory entries found' : 'No entries found for your account'}
        </Text>
      </View>
    )}
    onEndReached={() => {
      if (!loading && entries.length > 0 && entries.length >= itemsPerPage) {
        loadMoreEntries();
      }
    }}
    onEndReachedThreshold={0.1}
    ListFooterComponent={() => {
      if (loading && entries.length > 0) {
        return (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadMoreText}>Loading more entries...</Text>
          </View>
        );
      }
      return null;
    }}
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

      {/* Entry Details Modal */}
      <InventoryEntryDetailsModal
        visible={showEntryDetails}
        onClose={() => {
          setShowEntryDetails(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
      />

      {/* Filters Modal */}
      <InventoryFiltersModal
        isVisible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={{
          search: filters.search || '',
          entry_type: filters.entry_type || '',
          user_id: filters.user_id || 0,
          location_id: filters.location_id || 0,
          product_id: filters.product_id || 0,
          category: filters.category || '',
          subcategory_id: filters.subcategory_id || 0,
          reference_id: filters.reference_id || '',
          date_from: filters.date_from || '',
          date_to: filters.date_to || '',
          days: filters.days || 0,
        }}
        onApplyFilters={handleApplyFilters}
        subcategories={subcategories}
        locations={locations}
        users={users}
        products={products}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  logToggleButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  logToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  logToggleTextActive: {
    color: '#2563eb',
  },
  backButtonContainer: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'white',
  },
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  stockList: {
    paddingRight: 20,
  },
  stockCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stockDetails: {
    gap: 8,
    marginBottom: 12,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  stockLocation: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  entryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  entryDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  entryTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  entryUser: {
    fontSize: 12,
    color: '#2563eb',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  productInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  productInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  stockInfo: {
    gap: 4,
  },
  stockText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  paginationButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  paginationText: {
    fontSize: 14,
    color: '#4b5563',
  },
  filtersSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filtersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  resetFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  filterResultsInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterResultsText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterColumn: {
    flex: 1,
  },
  productCountIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  productCountText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '500',
  },
  // Search and Filter Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
});