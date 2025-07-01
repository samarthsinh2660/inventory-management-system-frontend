import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Package, Plus, TrendingUp, TrendingDown, ChartBar as BarChart3 } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { createInventoryEntry, fetchProductStock, fetchInventoryEntries } from '../../store/slices/inventorySlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import Toast from 'react-native-toast-message';

const validationSchema = Yup.object({
  product_id: Yup.number().min(1, 'Product is required').required('Product is required'),
  quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
  entry_type: Yup.string().required('Entry type is required'),
  location_id: Yup.number().min(1, 'Location is required').required('Location is required'),
  notes: Yup.string(),
});

export default function InventoryScreen() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.products.list);
  const locations = useAppSelector(state => state.locations.list);
  const inventoryEntries = useAppSelector(state => state.inventory.entries);
  const stock = useAppSelector(state => state.inventory.stock);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchLocations());
    dispatch(fetchInventoryEntries());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProductId > 0) {
      dispatch(fetchProductStock(selectedProductId));
    }
  }, [selectedProductId, dispatch]);

  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const entryData = {
        product_id: values.product_id,
        quantity: parseFloat(values.quantity),
        entry_type: values.entry_type,
        location_id: values.location_id,
        notes: values.notes || undefined,
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
      dispatch(fetchInventoryEntries());
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create inventory entry',
      });
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStock = selectedProductId > 0 ? (stock[selectedProductId] || 0) : 0;

  const recentEntries = inventoryEntries.slice(0, 10);

  const StockCard = ({ product }: { product: any }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <Text style={styles.stockProductName}>{product.name}</Text>
        <View style={[styles.stockBadge, { 
          backgroundColor: (product.current_stock || 0) < (product.min_stock_threshold || 0) ? '#fef2f2' : '#f0fdf4' 
        }]}>
          <Text style={[styles.stockBadgeText, { 
            color: (product.current_stock || 0) < (product.min_stock_threshold || 0) ? '#dc2626' : '#16a34a' 
          }]}>
            {(product.current_stock || 0) < (product.min_stock_threshold || 0) ? 'Low' : 'OK'}
          </Text>
        </View>
      </View>
      <View style={styles.stockDetails}>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Current Stock</Text>
          <Text style={styles.stockValue}>{product.current_stock || 0} {product.unit}</Text>
        </View>
        {product.min_stock_threshold && (
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Minimum</Text>
            <Text style={styles.stockValue}>{product.min_stock_threshold} {product.unit}</Text>
          </View>
        )}
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Value</Text>
          <Text style={styles.stockValue}>${((product.current_stock || 0) * product.cost).toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.stockLocation}>{product.location_name}</Text>
    </View>
  );

  const EntryItem = ({ entry }: { entry: any }) => (
    <View style={styles.entryItem}>
      <View style={[styles.entryIcon, { 
        backgroundColor: entry.entry_type.includes('in') ? '#dcfce7' : '#fef2f2' 
      }]}>
        {entry.entry_type.includes('in') ? (
          <TrendingUp size={16} color="#16a34a" />
        ) : (
          <TrendingDown size={16} color="#dc2626" />
        )}
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryProduct}>{entry.product_name}</Text>
        <Text style={styles.entryDetails}>
          {entry.entry_type.replace('_', ' ').toUpperCase()}: {entry.quantity} units
        </Text>
        <Text style={styles.entryTime}>
          {new Date(entry.created_at).toLocaleString()} • {entry.location_name}
        </Text>
      </View>
    </View>
  );

  if (showEntryForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowEntryForm(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Entry</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Formik
            initialValues={{
              product_id: 0,
              quantity: '',
              entry_type: 'manual_in',
              location_id: 0,
              notes: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
              <View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Product Selection</Text>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Product*</Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={values.product_id}
                        onValueChange={(value) => {
                          setFieldValue('product_id', value);
                          setSelectedProductId(value);
                        }}
                      >
                        <Picker.Item label="Select Product" value={0} />
                        {products.map((product) => (
                          <Picker.Item
                            key={product.id}
                            label={`${product.name} (${product.unit})`}
                            value={product.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {touched.product_id && errors.product_id && (
                    <Text style={styles.errorText}>{errors.product_id}</Text>
                  )}

                  {selectedProduct && (
                    <View style={styles.productInfo}>
                      <Text style={styles.productInfoTitle}>Current Stock Information</Text>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockText}>
                          Current Stock: {currentStock} {selectedProduct.unit}
                        </Text>
                        {selectedProduct.min_stock_threshold && (
                          <Text style={[styles.stockText, { 
                            color: currentStock < selectedProduct.min_stock_threshold ? '#ef4444' : '#10b981' 
                          }]}>
                            Minimum: {selectedProduct.min_stock_threshold} {selectedProduct.unit}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Entry Details</Text>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Entry Type*</Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={values.entry_type}
                        onValueChange={(value) => setFieldValue('entry_type', value)}
                      >
                        <Picker.Item label="Manual In" value="manual_in" />
                        <Picker.Item label="Manual Out" value="manual_out" />
                        <Picker.Item label="Manufacturing In" value="manufacturing_in" />
                        <Picker.Item label="Manufacturing Out" value="manufacturing_out" />
                      </Picker>
                    </View>
                  </View>

                  <TextInput
                    label="Quantity*"
                    value={values.quantity}
                    onChangeText={handleChange('quantity')}
                    onBlur={handleBlur('quantity')}
                    error={touched.quantity && !!errors.quantity}
                    keyboardType="numeric"
                    style={styles.input}
                    right={selectedProduct && <TextInput.Affix text={selectedProduct.unit} />}
                  />
                  {touched.quantity && errors.quantity && (
                    <Text style={styles.errorText}>{errors.quantity}</Text>
                  )}

                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Location*</Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={values.location_id}
                        onValueChange={(value) => setFieldValue('location_id', value)}
                      >
                        <Picker.Item label="Select Location" value={0} />
                        {locations.map((location) => (
                          <Picker.Item
                            key={location.id}
                            label={location.name}
                            value={location.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {touched.location_id && errors.location_id && (
                    <Text style={styles.errorText}>{errors.location_id}</Text>
                  )}

                  <TextInput
                    label="Notes"
                    value={values.notes}
                    onChangeText={handleChange('notes')}
                    onBlur={handleBlur('notes')}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    placeholder="Optional notes about this entry"
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    disabled={!selectedProduct}
                    style={styles.submitButton}
                    contentStyle={styles.buttonContent}
                  >
                    Submit Entry
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
        <View style={styles.headerContent}>
          <BarChart3 size={24} color="#2563eb" />
          <Text style={styles.title}>Inventory Overview</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowEntryForm(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Levels</Text>
          <FlatList
            data={products}
            renderItem={({ item }) => <StockCard product={item} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stockList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <TouchableOpacity onPress={() => setShowEntryForm(true)}>
              <Text style={styles.sectionLink}>Add Entry</Text>
            </TouchableOpacity>
          </View>
          {recentEntries.map((entry) => (
            <EntryItem key={entry.id} entry={entry} />
          ))}
          {recentEntries.length === 0 && (
            <View style={styles.emptyState}>
              <Package size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No inventory entries yet</Text>
              <Text style={styles.emptySubtext}>Start by adding your first entry</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
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
  entryTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
});