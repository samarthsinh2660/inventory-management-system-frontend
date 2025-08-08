import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { X, Calendar, User, MapPin, Package, Hash, Filter } from 'lucide-react-native';
import { InventoryFiltersState, InventoryFiltersModalProps } from '@/types/general';
import { InventoryEntryType } from '@/types/inventory';
import { ProductCategory } from '@/types/product';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchProducts } from '@/store/slices/productsSlice';

export const InventoryFiltersModal: React.FC<InventoryFiltersModalProps> = ({
  isVisible,
  onClose,
  filters,
  onApplyFilters,
  subcategories,
  locations,
  users,
  products,
}) => {
  const dispatch = useAppDispatch();
  const [localFilters, setLocalFilters] = useState<InventoryFiltersState>(filters);
  

  const formatDateToString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getTodayDate = (): string => {
    return formatDateToString(new Date());
  };

  const getDateNDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDateToString(date);
  };

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Filter products based on selected filters (EXACT COPY from create entries)
  const filteredProducts = products.filter(product => {
    // Filter by category
    if (localFilters.category && product.category !== localFilters.category) {
      return false;
    }
    
    // Filter by subcategory - convert to number for comparison
    if (localFilters.subcategory_id > 0 && product.subcategory_id !== Number(localFilters.subcategory_id)) {
      return false;
    }
    
    return true;
  });

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: InventoryFiltersState = {
      search: '',
      entry_type: '',
      user_id: 0,
      location_id: 0,
      reference_id: '',
      product_id: 0,
      category: '',
      subcategory_id: 0,
      date_from: '',
      date_to: '',
      days: 0,
    };
    setLocalFilters(clearedFilters);
  };

  const getFilteredSubcategories = (selectedCategory: string) => {
    if (!selectedCategory) {
      return subcategories;
    }
    
    const categoryProductSubcategoryIds = new Set(
      products
        .filter(product => product.category === selectedCategory)
        .map(product => product.subcategory_id)
    );
    
    return subcategories.filter(subcategory => 
      categoryProductSubcategoryIds.has(subcategory.id)
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter Inventory Entries</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Package size={16} color="#374151" />
              <Text style={styles.sectionTitle}>Entry Type</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localFilters.entry_type}
                onValueChange={(value) => setLocalFilters({ ...localFilters, entry_type: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Entry Types" value="" />
                <Picker.Item label="Manual In" value={InventoryEntryType.MANUAL_IN} />
                <Picker.Item label="Manual Out" value={InventoryEntryType.MANUAL_OUT} />
                <Picker.Item label="Manufacturing In" value={InventoryEntryType.MANUFACTURING_IN} />
                <Picker.Item label="Manufacturing Out" value={InventoryEntryType.MANUFACTURING_OUT} />
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <View style={styles.sectionTitleContainer}>
                <User size={16} color="#374151" />
                <Text style={styles.sectionTitle}>User</Text>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={localFilters.user_id}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, user_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="All Users" value={0} />
                  {users.map((user) => (
                    <Picker.Item key={user.id} label={user.username} value={user.id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.halfWidth}>
              <View style={styles.sectionTitleContainer}>
                <MapPin size={16} color="#374151" />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={localFilters.location_id}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, location_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="All Locations" value={0} />
                  {locations.map((location) => (
                    <Picker.Item key={location.id} label={location.name} value={location.id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Hash size={16} color="#374151" />
              <Text style={styles.sectionTitle}>Reference ID</Text>
            </View>
            <TextInput
              style={styles.input}
              label="Reference ID"
              value={localFilters.reference_id}
              onChangeText={(text) => setLocalFilters({ ...localFilters, reference_id: text })}
              mode="outlined"
              placeholder="Enter exact reference ID"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Package size={16} color="#374151" />
              <Text style={styles.sectionTitle}>Product Filters</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Category</Text>
              <Picker
                selectedValue={localFilters.category}
                onValueChange={(value) => {
                  setLocalFilters({ 
                    ...localFilters, 
                    category: value,
                    subcategory_id: 0,
                    product_id: 0
                  });
                }}
                style={styles.picker}
              >
                <Picker.Item label="All Categories" value="" />
                {Object.values(ProductCategory).map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Subcategory</Text>
              <Picker
                selectedValue={localFilters.subcategory_id}
                onValueChange={(value) => {
                  setLocalFilters({ 
                    ...localFilters, 
                    subcategory_id: value,
                    product_id: 0
                  });
                }}
                style={styles.picker}
              >
                <Picker.Item label="All Subcategories" value={0} />
                {getFilteredSubcategories(localFilters.category).map((subcategory) => (
                  <Picker.Item key={subcategory.id} label={subcategory.name} value={subcategory.id} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Specific Product</Text>
              <Picker
                selectedValue={localFilters.product_id}
                onValueChange={(value) => setLocalFilters({ ...localFilters, product_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Products" value={0} />
                {filteredProducts.map((product) => (
                  <Picker.Item key={product.id} label={product.name} value={product.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={16} color="#374151" />
              <Text style={styles.sectionTitle}>Date Range</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.input}
                  label="From Date"
                  value={localFilters.date_from}
                  onChangeText={(text) => setLocalFilters({ ...localFilters, date_from: text, days: 0 })}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  right={<TextInput.Icon icon="calendar" onPress={() => {
                    if (!localFilters.date_from) {
                      setLocalFilters({ ...localFilters, date_from: getTodayDate(), days: 0 });
                    }
                  }} />}
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.input}
                  label="To Date"
                  value={localFilters.date_to}
                  onChangeText={(text) => setLocalFilters({ ...localFilters, date_to: text, days: 0 })}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  right={<TextInput.Icon icon="calendar" onPress={() => {
                    if (!localFilters.date_to) {
                      setLocalFilters({ ...localFilters, date_to: getTodayDate(), days: 0 });
                    }
                  }} />}
                />
              </View>
            </View>
            <Text style={styles.orText}>OR</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Quick Date Filter</Text>
              <Picker
                selectedValue={localFilters.days}
                onValueChange={(value) => {
                  setLocalFilters({ 
                    ...localFilters, 
                    days: value,
                    date_from: value > 0 ? '' : localFilters.date_from,
                    date_to: value > 0 ? '' : localFilters.date_to
                  });
                }}
                style={styles.picker}
              >
                <Picker.Item label="Any time" value={0} />
                <Picker.Item label="Last 1 day" value={1} />
                <Picker.Item label="Last 3 days" value={3} />
                <Picker.Item label="Last 7 days" value={7} />
              </Picker>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <Button
            mode="contained"
            onPress={handleApply}
            style={styles.applyButton}
            contentStyle={styles.applyButtonContent}
          >
            Apply Filters
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    marginVertical: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    flex: 1,
    marginLeft: 12,
  },
  applyButtonContent: {
    paddingVertical: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});