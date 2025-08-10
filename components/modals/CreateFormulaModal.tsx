import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { X, Plus, Minus, Trash2 } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { createFormula, updateFormula} from '../../store/slices/formulasSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchProducts, fetchProductById } from '../../store/slices/productsSlice';
import Toast from 'react-native-toast-message';
import { CreateFormulaData, Product, ProductCategory } from '@/types/product';
import { CreateFormulaModalProps } from '@/types/general';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  components: Yup.array()
    .of(
      Yup.object({
        component_id: Yup.number().required('Product is required'),
        quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
      })
    )
    .min(1, 'At least one component is required'),
});

// Helper function to get initial values
const getInitialValues = (editingFormula?: any) => {
  if (editingFormula) {
    return {
      name: editingFormula.name || '',
      description: editingFormula.description || '',
      components: editingFormula.components && editingFormula.components.length > 0 
        ? editingFormula.components.map((comp: any, index: number) => ({
            component_id: comp.component_id || 0,
            quantity: comp.quantity || 0,
          }))
        : [{ component_id: 0, quantity: 0 }],
    };
  }
  return {
    name: '',
    description: '',
    components: [{ component_id: 0, quantity: 0 }],
  };
};

export const CreateFormulaModal: React.FC<CreateFormulaModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  editingFormula,
}) => {
  const dispatch = useAppDispatch();
  const subcategories = useAppSelector(state => state.subcategories.list);
  const isEditing = !!editingFormula;

  // Locally managed products loaded from backend based on filters
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // Cache for selected products so labels persist even if filtered out
  const [selectedProductsCache, setSelectedProductsCache] = useState<Map<number, Product>>(new Map());

  // Product filter states
  const [productFilters, setProductFilters] = useState<{ category: ProductCategory | ''; subcategoryId: number}>({
    category: '',
    subcategoryId: 0,
  });

  // Form values state to prevent resetting when filters change
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    components: [{ component_id: 0, quantity: 0 }],
  });

  // Custom dropdown visibility state
  const [dropdownVisible, setDropdownVisible] = useState<{[key: number]: boolean}>({});

  // Helper: get label for selected product using current filtered list or cache
  const getSelectedProductDisplay = (componentId: number) => {
    if (!componentId) return 'Select Product';
    let product = products.find(p => p.id === componentId);
    if (!product && selectedProductsCache.has(componentId)) {
      product = selectedProductsCache.get(componentId)!;
    }
    return product ? `${product.name} (${product.unit})` : 'Select Product';
  };

  // Helper: when product chosen from dropdown, update cache and form value
  const handleProductSelect = (
    index: number,
    productId: number,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void
  ) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProductsCache(prev => {
        const next = new Map(prev);
        next.set(productId, product);
        return next;
      });
    }
    setFieldValue(`components.${index}.component_id`, productId);
    setDropdownVisible(prev => ({ ...prev, [index]: false }));
  };

  // Helper function to get filtered subcategories based on selected category
  const getFilteredSubcategories = (selectedCategory: string) => {
    if (!selectedCategory) return subcategories;
    // Use currently loaded products (already filtered by category) to determine which subcategories are relevant
    const subcatIds = new Set(products.map(p => p.subcategory_id));
    return subcategories.filter(sc => subcatIds.has(sc.id));
  };

  // Load products from backend based on current filters
  const loadProducts = async (category: ProductCategory | '', subcategoryId: number) => {
    try {
      setLoadingProducts(true);
      const res = await dispatch(
        fetchProducts({
          category: (category || undefined) as ProductCategory | undefined,
          subcategory_id: subcategoryId > 0 ? subcategoryId : undefined,
          limit: 100,
          page: 1,
        })
      ).unwrap();
      const list: Product[] = res.data || [];

      // When editing, ensure currently selected component products exist in list
      if (isEditing && editingFormula?.components?.length) {
        const idsInList = new Set(list.map(p => p.id));
        const neededIds: number[] = editingFormula.components
          .map((c: any) => Number(c.component_id))
          .filter((id: number) => !!id && !idsInList.has(id));

        if (neededIds.length) {
          const fetched: Product[] = [];
          for (const pid of neededIds) {
            try {
              const pr = await dispatch(fetchProductById(pid)).unwrap();
              if (pr?.data) fetched.push(pr.data as Product);
            } catch (e: any) {
              // Ignore missing products; continue
            }
          }
          setProducts([...list, ...fetched]);
        } else {
          setProducts(list);
        }
      } else {
        setProducts(list);
      }
    } catch (error: any) {
      // Prefer backend-provided error message
      let message = 'Failed to load products';
      if (typeof error === 'string') message = error;
      else if (error?.response?.data?.error?.message) message = error.response.data.error.message;
      else if (error?.response?.data?.message) message = error.response.data.message;
      else if (error?.message) message = error.message;
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch products when modal opens and when filters change
  useEffect(() => {
    if (!isVisible) return;
    loadProducts(productFilters.category, productFilters.subcategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, productFilters.category, productFilters.subcategoryId]);

  // Products are already filtered by backend fetch; keep the name for compatibility
  const filteredProducts = products;

  // Handle filter changes
  const handleCategoryChange = (value: ProductCategory | '') => {
    setProductFilters(prev => ({
      ...prev,
      category: (value || '') as ProductCategory | '',
      // Reset subcategory when category changes to ensure compatibility
      subcategoryId: 0,
    }));
  };

  const handleSubcategoryChange = (value: number) => {
    setProductFilters(prev => ({
      ...prev,
      subcategoryId: Number(value),
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setProductFilters({
      category: '',
      subcategoryId: 0,
    });
  };

  // Initialize form values when modal opens or editing formula changes
  useEffect(() => {
    if (isVisible) {
      const initialValues = getInitialValues(editingFormula);
      setFormValues(initialValues);
    }
  }, [isVisible, editingFormula, isEditing]);

  // Fetch subcategories when modal opens
  useEffect(() => {
    if (isVisible) {
      dispatch(fetchSubcategories());
    }
  }, [isVisible, dispatch]);

  // Reset filters when modal opens
  useEffect(() => {
    if (isVisible) {
      resetFilters();
    }
  }, [isVisible]);



  const handleSubmit = async (values: {
    name: string;
    description: string;
    components: { component_id: number; quantity: number }[];
  }) => {
    try {
      const formulaData: CreateFormulaData = {
        name: values.name,
        description: values.description || null,
        components: values.components.map(comp => ({
          component_id: comp.component_id,
          quantity: comp.quantity,
        })),
      };

      let result;
      if (isEditing) {
        result = await dispatch(updateFormula({
          id: editingFormula.id,
          data: formulaData
        })).unwrap();
      } else {
        result = await dispatch(createFormula(formulaData)).unwrap();
      }
      if (onSuccess) {
        await onSuccess(result.data);
      }
      onClose();
    } catch (error: any) {
      // Show backend message if available
      let message = `Failed to ${isEditing ? 'update' : 'create'} formula`;
      if (typeof error === 'string') message = error;
      else if (error?.response?.data?.error?.message) message = error.response.data.error.message;
      else if (error?.response?.data?.message) message = error.response.data.message;
      else if (error?.message) message = error.message;
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    }
  };



  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Formula' : 'Create Formula'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Formik
          key={editingFormula?.id || 'new-formula'}
          initialValues={formValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Basic Info Section */}
              <View style={styles.basicInfoSection}>
                <TextInput
                  label="Name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={touched.name && !!errors.name}
                  style={styles.input}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{String(errors.name)}</Text>
                )}

                <TextInput
                  label="Description"
                  value={values.description}
                  onChangeText={handleChange('description')}
                  onBlur={handleBlur('description')}
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />
              </View>

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

              <Text style={styles.sectionTitle}>Component</Text>

              {/* Component Section with its own scrolling */}
              <FieldArray name="components">
                {({ push, remove }) => (
                  <View>
                    <ScrollView style={styles.componentsScrollView} nestedScrollEnabled>
                      {values.components.map((component, index: number) => (
                        <View key={index} style={styles.componentRow}>
                          <View style={styles.productColumn}>
                            <Text style={styles.label}>Product</Text>
                        <TouchableOpacity 
                          style={styles.customPicker}
                          onPress={() => setDropdownVisible(prev => ({...prev, [index]: !prev[index]}))}
                        >
                          <Text style={styles.customPickerText}>
                            {getSelectedProductDisplay(component.component_id)}
                          </Text>
                          <Text style={styles.customPickerArrow}>{dropdownVisible[index] ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {dropdownVisible[index] && (
                          <ScrollView style={styles.customDropdown} nestedScrollEnabled>
                            <TouchableOpacity
                              style={styles.customOption}
                              onPress={() => {
                                setFieldValue(`components.${index}.component_id`, 0);
                                setDropdownVisible(prev => ({...prev, [index]: false}));
                              }}
                            >
                              <Text>Select Product</Text>
                            </TouchableOpacity>
                            {filteredProducts
                              .filter(product =>
                                // Exclude products already selected in any component
                                !values.components.some(comp => comp.component_id === product.id)
                              )
                              .map((product) => (
                                <TouchableOpacity
                                  key={product.id}
                                  style={styles.customOption}
                                  onPress={() => handleProductSelect(index, product.id, setFieldValue)}
                                >
                                  <Text>{product.name} ({product.unit})</Text>
                                </TouchableOpacity>
                              ))}
                          </ScrollView>
                        )}
                        {touched.components && 
                         (touched.components as any[])[index] && 
                         errors.components && 
                         Array.isArray(errors.components) && 
                         errors.components[index] && 
                         typeof errors.components[index] === 'object' && 
                         'component_id' in errors.components[index] && (
                          <Text style={styles.errorText}>
                            {String((errors.components[index] as any).component_id)}
                          </Text>
                        )}
                        </View>

                        <View style={styles.quantityColumn}>
                          <Text style={styles.label}>Quantity</Text>
                          <TextInput
                            value={component.quantity.toString()}
                            onChangeText={(value) =>
                              setFieldValue(`components.${index}.quantity`, parseFloat(value) || 0)
                            }
                            keyboardType="numeric"
                            style={styles.quantityInput}
                          />
                          {touched.components && 
                           (touched.components as any[])[index] && 
                           errors.components && 
                           Array.isArray(errors.components) && 
                           errors.components[index] && 
                           typeof errors.components[index] === 'object' && 
                           'quantity' in errors.components[index] && (
                            <Text style={styles.errorText}>
                              {String((errors.components[index] as any).quantity)}
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={() => remove(index)}
                          style={styles.removeButton}
                          disabled={values.components.length === 1}
                        >
                          <Trash2 size={16} color={values.components.length === 1 ? '#d1d5db' : '#ef4444'} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    </ScrollView>

                    <TouchableOpacity
                      onPress={() => push({ component_id: 0, quantity: 0 })}
                      style={styles.addButton}
                    >
                      <Plus size={20} color="#2563eb" />
                      <Text style={styles.addButtonText}>Add Component</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </FieldArray>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={onClose}
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
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </View>
            </ScrollView>
          )}
        </Formik>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  form: {
    maxHeight: 500,
  },
  componentsScrollView: {
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  pickerContainer: {
    flex: 2,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: 'white',
    minHeight: 56,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    backgroundColor: 'white',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#2563eb',
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  filtersSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  basicInfoSection: {
    marginBottom: 12,
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
  productColumn: {
    flex: 2,
  },
  quantityColumn: {
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
  customPicker: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    backgroundColor: 'white',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  customPickerText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  customPickerArrow: {
    color: '#6b7280',
  },
  customDropdown: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#000000',
    borderTopWidth: 0,
    backgroundColor: 'white',
    borderRadius: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  customOption: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
});