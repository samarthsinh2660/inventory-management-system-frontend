import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { ArrowLeft, Plus, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { createProduct } from '../store/slices/productsSlice';
import { fetchSubcategories } from '../store/slices/subcategoriesSlice';
import { fetchLocations } from '../store/slices/locationsSlice';
import { fetchFormulas } from '../store/slices/formulasSlice';
import { CreateSubcategoryModal } from '../components/modals/CreateSubcategoryModal';
import { CreateLocationModal } from '../components/modals/CreateLocationModal';
import { CreateFormulaModal } from '../components/modals/CreateFormulaModal';
import Toast from 'react-native-toast-message';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  unit: Yup.string().required('Unit is required'),
  cost: Yup.number().min(0, 'Cost must be positive').required('Cost is required'),
  category: Yup.string().oneOf(['raw', 'semi', 'finished']).required('Category is required'),
  source_type: Yup.string().oneOf(['manufacturing', 'trading']).required('Source type is required'),
  subcategory_id: Yup.number().min(1, 'Subcategory is required').required('Subcategory is required'),
  location_id: Yup.number().min(1, 'Location is required').required('Location is required'),
  min_stock_threshold: Yup.number().min(0, 'Threshold must be positive'),
  formula_id: Yup.number(),
});

export default function CreateProduct() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const subcategories = useAppSelector(state => state.subcategories.list);
  const locations = useAppSelector(state => state.locations.list);
  const formulas = useAppSelector(state => state.formulas.list);
  
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  useEffect(() => {
    dispatch(fetchSubcategories());
    dispatch(fetchLocations());
    dispatch(fetchFormulas());
  }, [dispatch]);

  const handleSubmit = async (values: any) => {
    try {
      const productData = {
        ...values,
        price: parseFloat(values.cost), // Map cost to price for the API
        cost: undefined, // Remove cost as it's not needed by API
        min_stock_threshold: values.min_stock_threshold ? parseFloat(values.min_stock_threshold) : undefined,
        formula_id: values.formula_id || undefined,
      };
      
      await dispatch(createProduct(productData)).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Product created successfully',
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create product',
      });
    }
  };

  // Helper function to get selected item name
  const getSelectedItemName = (items: any[], selectedId: number) => {
    const item = items.find(item => item.id === selectedId);
    return item ? item.name : null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <Formik
        initialValues={{
          name: '',
          unit: '',
          cost: '',
          category: 'raw',
          source_type: 'trading',
          subcategory_id: 0,
          location_id: 0,
          min_stock_threshold: '',
          formula_id: 0,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                label="Product Name*"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && !!errors.name}
                style={styles.input}
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                label="Unit*"
                value={values.unit}
                onChangeText={handleChange('unit')}
                onBlur={handleBlur('unit')}
                error={touched.unit && !!errors.unit}
                style={styles.input}
                placeholder="e.g., kg, pcs, liter"
              />
              {touched.unit && errors.unit && (
                <Text style={styles.errorText}>{errors.unit}</Text>
              )}

              <TextInput
                label="Cost per Unit*"
                value={values.cost}
                onChangeText={handleChange('cost')}
                onBlur={handleBlur('cost')}
                error={touched.cost && !!errors.cost}
                keyboardType="numeric"
                style={styles.input}
              />
              {touched.cost && errors.cost && (
                <Text style={styles.errorText}>{errors.cost}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Classification</Text>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Category*</Text>
                <View style={[styles.picker, values.category && styles.selectedPicker]}>
                  <Picker
                    selectedValue={values.category}
                    onValueChange={(value) => setFieldValue('category', value)}
                  >
                    <Picker.Item label="Raw Material" value="raw" />
                    <Picker.Item label="Semi-Finished" value="semi" />
                    <Picker.Item label="Finished Product" value="finished" />
                  </Picker>
                </View>
                <View style={styles.selectionIndicator}>
                  <Check size={16} color="#10b981" />
                  <Text style={styles.selectedStatus}>
                    {values.category === 'raw' ? 'Raw Material' : 
                     values.category === 'semi' ? 'Semi-Finished' : 'Finished Product'} selected
                  </Text>
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Source Type*</Text>
                <View style={[styles.picker, values.source_type && styles.selectedPicker]}>
                  <Picker
                    selectedValue={values.source_type}
                    onValueChange={(value) => setFieldValue('source_type', value)}
                  >
                    <Picker.Item label="Trading" value="trading" />
                    <Picker.Item label="Manufacturing" value="manufacturing" />
                  </Picker>
                </View>
                <View style={styles.selectionIndicator}>
                  <Check size={16} color="#10b981" />
                  <Text style={styles.selectedStatus}>
                    {values.source_type === 'trading' ? 'Trading' : 'Manufacturing'} selected
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location & Category</Text>
              
              <View style={styles.dropdownWithAdd}>
                <View style={[styles.pickerContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Subcategory*</Text>
                  <View style={[styles.picker, values.subcategory_id > 0 && styles.selectedPicker]}>
                    <Picker
                      selectedValue={values.subcategory_id}
                      onValueChange={(value) => setFieldValue('subcategory_id', value)}
                    >
                      <Picker.Item label="Select Subcategory" value={0} />
                      {subcategories.map((subcategory) => (
                        <Picker.Item
                          key={subcategory.id}
                          label={subcategory.name}
                          value={subcategory.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {values.subcategory_id > 0 ? (
                    <View style={styles.selectionIndicator}>
                      <Check size={16} color="#10b981" />
                      <Text style={styles.selectedStatus}>
                        {getSelectedItemName(subcategories, values.subcategory_id)} selected
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.unselectedStatus}>No subcategory selected</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowSubcategoryModal(true)}
                >
                  <Plus size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              {touched.subcategory_id && errors.subcategory_id && (
                <Text style={styles.errorText}>{errors.subcategory_id}</Text>
              )}

              <View style={styles.dropdownWithAdd}>
                <View style={[styles.pickerContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Location*</Text>
                  <View style={[styles.picker, values.location_id > 0 && styles.selectedPicker]}>
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
                  {values.location_id > 0 ? (
                    <View style={styles.selectionIndicator}>
                      <Check size={16} color="#10b981" />
                      <Text style={styles.selectedStatus}>
                        {getSelectedItemName(locations, values.location_id)} selected
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.unselectedStatus}>No location selected</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowLocationModal(true)}
                >
                  <Plus size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              {touched.location_id && errors.location_id && (
                <Text style={styles.errorText}>{errors.location_id}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory Settings</Text>
              
              <TextInput
                label="Minimum Stock Threshold"
                value={values.min_stock_threshold}
                onChangeText={handleChange('min_stock_threshold')}
                onBlur={handleBlur('min_stock_threshold')}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Enter minimum stock threshold"
              />
            </View>

            {values.category !== 'raw' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Manufacturing Formula</Text>
                
                <View style={styles.dropdownWithAdd}>
                  <View style={[styles.pickerContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Formula</Text>
                    <View style={[styles.picker, values.formula_id > 0 && styles.selectedPicker]}>
                      <Picker
                        selectedValue={values.formula_id}
                        onValueChange={(value) => setFieldValue('formula_id', value)}
                      >
                        <Picker.Item label="No Formula" value={0} />
                        {formulas.map((formula) => (
                          <Picker.Item
                            key={formula.id}
                            label={formula.name}
                            value={formula.id}
                          />
                        ))}
                      </Picker>
                    </View>
                    {values.formula_id > 0 ? (
                      <View style={styles.selectionIndicator}>
                        <Check size={16} color="#10b981" />
                        <Text style={styles.selectedStatus}>
                          {getSelectedItemName(formulas, values.formula_id)} selected
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.unselectedStatus}>No formula selected</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowFormulaModal(true)}
                  >
                    <Plus size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                loading={isSubmitting}
                style={styles.button}
              >
                Create Product
              </Button>
            </View>
          </ScrollView>
        )}
      </Formik>

      <CreateSubcategoryModal
        isVisible={showSubcategoryModal}
        onClose={() => setShowSubcategoryModal(false)}
        onSuccess={(subcategory) => {
          // Refresh subcategories list
          dispatch(fetchSubcategories());
        }}
      />

      <CreateLocationModal
        isVisible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={(location) => {
          // Refresh locations list
          dispatch(fetchLocations());
        }}
      />

      <CreateFormulaModal
        isVisible={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        onSuccess={(formula) => {
          // Refresh formulas list
          dispatch(fetchFormulas());
        }}
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
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
  selectedPicker: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  dropdownWithAdd: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  selectedStatus: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  unselectedStatus: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});