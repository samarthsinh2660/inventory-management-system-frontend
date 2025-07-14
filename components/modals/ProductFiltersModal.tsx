import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { ProductFiltersModalProps, ProductFiltersState } from '@/types/general';

const { height: screenHeight } = Dimensions.get('window');

export function ProductFiltersModal({
  isVisible,
  onClose,
  filters,
  onApplyFilters,
  subcategories,
  locations,
  formulas,
}: ProductFiltersModalProps) {
  const [tempFilters, setTempFilters] = useState<ProductFiltersState>(filters);

  // Sync tempFilters when modal opens or filters change
  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters, isVisible]);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ProductFiltersState = {
      category: '',
      subcategory_id: 0,
      location_id: 0,
      source_type: '',
      formula_id: 0,
    };
    setTempFilters(resetFilters);
  };

  const categories = [
    { label: 'Raw Materials', value: 'raw' },
    { label: 'Finished Products', value: 'finished' },
    { label: 'Packaging', value: 'packaging' },
    { label: 'Chemicals', value: 'chemicals' }
  ];
  const sourceTypes = ['manufacturing', 'trading'];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Filter Products</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.category}
                onValueChange={(value: string) =>
                  setTempFilters((prev: ProductFiltersState) => ({ ...prev, category: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Categories" value="" />
                {categories.map((category) => (
                  <Picker.Item key={category.value} label={category.label} value={category.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Subcategory Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Subcategory</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.subcategory_id}
                onValueChange={(value: number) =>
                  setTempFilters((prev: ProductFiltersState) => ({ ...prev, subcategory_id: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Subcategories" value={0} />
                {subcategories.map((subcategory) => (
                  <Picker.Item
                    key={subcategory.id}
                    label={subcategory.name}
                    value={subcategory.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Location Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Location</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.location_id}
                onValueChange={(value: number) =>
                  setTempFilters((prev: ProductFiltersState) => ({ ...prev, location_id: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Locations" value={0} />
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

          {/* Source Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Source Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.source_type}
                onValueChange={(value: string) =>
                  setTempFilters((prev: ProductFiltersState) => ({ ...prev, source_type: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Source Types" value="" />
                {sourceTypes.map((type) => (
                  <Picker.Item
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    value={type}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Formula Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Formula</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.formula_id}
                onValueChange={(value: number) =>
                  setTempFilters((prev: ProductFiltersState) => ({ ...prev, formula_id: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Formulas" value={0} />
                {formulas.map((formula) => (
                  <Picker.Item
                    key={formula.id}
                    label={formula.name}
                    value={formula.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Check size={20} color="white" />
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});