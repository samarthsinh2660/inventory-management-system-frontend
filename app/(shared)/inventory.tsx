import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Package, Plus, TrendingUp, TrendingDown, ChartBar as BarChart3, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { createInventoryEntry, fetchInventoryBalance, fetchInventoryEntries, fetchUserEntries } from '../../store/slices/inventorySlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import Toast from 'react-native-toast-message';
import {
  formatEntryType,
  getEntryTypeColor,
  getEntryTypeBackgroundColor,
  usePagination
} from '../../utils/helperFunctions';
import InventoryEntryDetailsModal from '../../components/modals/InventoryEntryDetailsModal';
import AllBalancesModal from '../../components/modals/AllBalancesModal';
import { UserRole } from '@/types/user';
import { 
  InventoryEntryType, 
  InventoryEntry,
  CreateInventoryEntryData ,
  InventoryFormValues,
  StockCardProps,
  EntryItemProps
} from '@/types/inventory';
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
  const { 
    entries: allEntries = [], 
    userEntries = [], 
    loading, 
    meta = { total: 0, pages: 0 }, 
    balance = [] 
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
  const [showAllBalances, setShowAllBalances] = useState(false);
  const itemsPerPage = 10;

  const isMaster = user?.role === UserRole.MASTER;
  const entries = viewMode === 'all' ? allEntries : userEntries;
 
  
  const pagination = usePagination(
    currentPage, 
    meta.total || 0, 
    itemsPerPage, 
    setCurrentPage
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Comprehensive refresh of all inventory data
    Promise.all([
      dispatch(fetchInventoryBalance()),
      dispatch(fetchProducts({ page: 1, limit: 100 })), // Fetch more products to ensure all are available
      dispatch(fetchLocations()),
      loadEntries(),
      // Also refresh user entries if user exists
      user ? dispatch(fetchUserEntries({ page: 1, limit: itemsPerPage })) : Promise.resolve()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch, user]);

  useEffect(() => {
    // Initial data load
    dispatch(fetchProducts({ page: 1, limit: 10 }));
    dispatch(fetchLocations());
    dispatch(fetchInventoryBalance());
    loadEntries();
    
    // Also load user entries on initial mount so they're available for toggle
    if (user) {
      dispatch(fetchUserEntries({ page: 1, limit: itemsPerPage }));
    }
    
    // Set up refresh interval for real-time updates (every 60 seconds)
    const intervalId = setInterval(() => {
      dispatch(fetchInventoryBalance());
      loadEntries();
    }, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    loadEntries();
  }, [viewMode, currentPage]);

  useEffect(() => {
    if (selectedProductId > 0) {
      // We already have balance data fetched on component mount
      // No need for additional stock fetching
    }
  }, [selectedProductId, dispatch]);

  const loadEntries = () => {
    const params = { page: currentPage, limit: itemsPerPage };
    
    if (viewMode === 'all') {
      dispatch(fetchInventoryEntries(params));
    } else {
      // Make sure to fetch user entries from the correct endpoint
      dispatch(fetchUserEntries(params));
    }
  };

  // Function to toggle between all entries and user entries
  const toggleViewMode = () => {
    const newMode = viewMode === 'all' ? 'mine' : 'all';
    setViewMode(newMode);
    setCurrentPage(1); // Reset to first page when changing views
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create inventory entry',
      });
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  // Find the current stock for the selected product from the balance data
  const selectedProductStock = selectedProductId > 0 
    ? balance.find(item => item.product_id === selectedProductId)?.total_quantity || 0
    : 0;

  const recentEntries = entries.slice(0, 10);

  const StockCard = ({ product }: StockCardProps) => {
    // Find stock information for this product from balance
    const stockInfo = balance.find(item => item.product_id === product.id);
    const currentStock = stockInfo ? stockInfo.total_quantity : 0;
    const minThreshold = product.min_stock_threshold || 0;
    const pricePerUnit = stockInfo?.price_per_unit || parseFloat(product.price?.toString()) || 0;
    const totalPrice = stockInfo?.total_price || (pricePerUnit * currentStock);
    
    return (
      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockProductName}>{product.name || 'Unknown Product'}</Text>
          <View style={[styles.stockBadge, { 
            backgroundColor: currentStock < minThreshold ? '#fef2f2' : '#f0fdf4' 
          }]}>
            <Text style={[styles.stockBadgeText, { 
              color: currentStock < minThreshold ? '#dc2626' : '#16a34a' 
            }]}>
              {currentStock < minThreshold ? 'Low' : 'OK'}
            </Text>
          </View>
        </View>
        <View style={styles.stockDetails}>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Current Stock</Text>
            <Text style={styles.stockValue}>{currentStock || 0} {product.unit || 'units'}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Min Threshold</Text>
            <Text style={styles.stockValue}>{minThreshold || 0} {product.unit || 'units'}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Price/Unit</Text>
            <Text style={styles.stockValue}>₹{(parseFloat(pricePerUnit?.toString()) || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Total Value</Text>
            <Text style={styles.stockValue}>₹{(parseFloat(totalPrice?.toString()) || 0).toFixed(2)}</Text>
          </View>
        </View>
        <Text style={styles.stockLocation}>{stockInfo?.location_name || 'Unknown Location'}</Text>
      </View>
    );
  };

  const EntryItem = ({ entry }: EntryItemProps) => {
    const displayUsername = entry.username || 'Unknown User';
    
    return (
      <TouchableOpacity 
        style={styles.entryItem}
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
              {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Unknown Date'} • {entry.location_name || 'Unknown Location'}
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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setShowEntryForm(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
          </View>
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
                      {products.map(product => (
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
                    <Text style={styles.productInfoTitle}>{selectedProduct.name || 'Unknown Product'} - Current Stock</Text>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockText}>Available: {selectedProductStock || 0} {selectedProduct.unit || 'units'}</Text>
                      <Text style={styles.stockText}>
                        Min Required: {selectedProduct.min_stock_threshold || 0} {selectedProduct.unit || 'units'}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Entry Type</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={values.entry_type}
                      onValueChange={handleChange('entry_type')}
                    >
                      <Picker.Item label="Manual In" value={InventoryEntryType.MANUAL_IN} />
                      <Picker.Item label="Manual Out" value={InventoryEntryType.MANUAL_OUT} />
                      <Picker.Item label="Manufacturing In" value={InventoryEntryType.MANUFACTURING_IN} />
                      <Picker.Item label="Manufacturing Out" value={InventoryEntryType.MANUFACTURING_OUT} />
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stock Levels</Text>
            <TouchableOpacity onPress={() => setShowAllBalances(true)}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stockList}
            contentContainerStyle={{ paddingLeft: 20 }}
          >
            {products.slice(0, 5).map(product => (
              <StockCard key={product.id} product={product} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {viewMode === 'all' ? 'All Inventory Entries' : 'My Inventory Entries'}
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No inventory entries found</Text>
              <Text style={styles.emptySubtext}>
                {viewMode === 'mine' ? 'You haven\'t created any inventory entries yet' : 'No inventory entries have been recorded yet'}
              </Text>
            </View>
          ) : (
            <>
              {entries.map(entry => (
                <EntryItem key={entry.id} entry={entry} />
              ))}
              
              {/* Pagination Controls */}
              {meta.pages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.paginationButton, !pagination.hasPrevPage && styles.paginationButtonDisabled]}
                    onPress={pagination.goToPrevPage}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft size={20} color={pagination.hasPrevPage ? "#2563eb" : "#9ca3af"} />
                  </TouchableOpacity>
                  
                  <Text style={styles.paginationText}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.paginationButton, !pagination.hasNextPage && styles.paginationButtonDisabled]}
                    onPress={pagination.goToNextPage}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight size={20} color={pagination.hasNextPage ? "#2563eb" : "#9ca3af"} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <InventoryEntryDetailsModal
        visible={showEntryDetails}
        onClose={() => {
          setShowEntryDetails(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
      />

      <AllBalancesModal
        visible={showAllBalances}
        onClose={() => setShowAllBalances(false)}
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
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
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
    padding: 20,
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
});