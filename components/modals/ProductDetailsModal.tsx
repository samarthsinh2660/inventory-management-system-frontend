import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput, Button } from 'react-native-paper';
import {
  X,
  Package,
  DollarSign,
  Ruler,
  AlertTriangle,
  Edit,
  Trash2,
  Check,
  Beaker,
  Plus,
  CircleDollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { updateProduct, deleteProduct } from '../../store/slices/productsSlice';
import { fetchFormulaById, fetchFormulas } from '../../store/slices/formulasSlice';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';

// Toast management to prevent spam
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showToast = (type: 'success' | 'error' | 'info', text1: string, text2: string) => {
  // Clear any existing toast timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  
  // Hide current toast and show new one after a brief delay
  Toast.hide();
  toastTimeout = setTimeout(() => {
    Toast.show({ type, text1, text2 });
  }, 100);
};
import { Picker } from '@react-native-picker/picker';
import { IfMaster } from '../IfMaster';
import { CreateFormulaModal } from './CreateFormulaModal';
import { ProductDetailsModalProps, ProductModalItem } from '@/types/general';
import { handelProductEdit, ProductCategory, ProductSourceType } from '@/types/product';

const validationSchema = Yup.object({
  name: Yup.string().required('Product name is required'),
  price: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  min_stock_threshold: Yup.number().min(0, 'Minimum stock must be positive').required('Minimum stock is required'),
  unit: Yup.string().required('Unit is required'),
  category: Yup.string().required('Category is required'),
  subcategory_id: Yup.number().min(1, 'Subcategory is required'),
  location_id: Yup.number().min(1, 'Location is required'),
  source_type: Yup.string().required('Source type is required'),
});

export default function ProductDetailsModal({ visible, onClose, product, onProductUpdated }: ProductDetailsModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productFormula, setProductFormula] = useState<any>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any>(null);
  const [detailedProduct, setDetailedProduct] = useState<ProductModalItem | null>(null);
  const [supplierExpanded, setSupplierExpanded] = useState(false);

  const subcategories = useAppSelector(state => state.subcategories.list || []);
  const locations = useAppSelector(state => state.locations.list || []);
  const formulas = useAppSelector(state => state.formulas.list || []);
  const user = useAppSelector(state => state.auth.user);

  const isMaster = user?.role === 'master';

  useEffect(() => {
    if (visible && product) {
      setEditMode(false);
      setDetailedProduct(product as ProductModalItem);
    }
  }, [visible, product]);

  // Separate useEffect for formula fetching to avoid duplicate calls
  useEffect(() => {
    if (visible && product?.product_formula_id) {
      dispatch(fetchFormulaById(product.product_formula_id))
        .unwrap()
        .then((formulaResponse) => {
          setProductFormula(formulaResponse.data);
        })
        .catch(() => {
          setProductFormula(null);
        });
    } else if (visible && !product?.product_formula_id) {
      setProductFormula(null);
    }
  }, [visible, product?.product_formula_id, dispatch]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setDetailedProduct(null);
      setProductFormula(null);
    }
  }, [visible]);

  const handleClose = () => {
    setEditMode(false);
    setProductFormula(null);
    onClose();
  };

  const handleSupplierDelete = () => {
    if (!product) return;
    
    Alert.alert(
      'Remove Supplier',
      `Are you sure you want to remove supplier information from "${product.name}"?\n\nThis will permanently delete all supplier details including business name, contact information, and GST details.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (!product) return;
            
            try {
              // Update product to remove supplier reference
              const updateData = {
                name: product.name,
                price: parseFloat(product.price?.toString() || '0') || 0,
                min_stock_threshold: parseInt((product.min_stock_threshold || 0).toString()) || 0,
                unit: product.unit,
                category: product.category as any,
                subcategory_id: parseInt((product.subcategory_id || 0).toString()) || 0,
                location_id: parseInt((product.location_id || 0).toString()) || 0,
                source_type: product.source_type as any,
                purchase_info_id: null // Remove supplier reference
              };
              
              await dispatch(updateProduct({
                id: product.id!,
                data: updateData
              })).unwrap();
              
              showToast('success', 'Success', 'Supplier information removed from product');
              
              // After update, call the onProductUpdated callback to refresh the product in the parent
              // This will ensure the list and this modal are in sync
              onProductUpdated?.();
            } catch (error: any) {
              showToast('error', 'Error', error.message || 'Failed to remove supplier information');
            }
          }
        }
      ]
    );
  };

  const getSelectedItemName = (items: Array<{ id: number; name: string }>, selectedId: number) => {
    if (!items || items.length === 0) return 'None';
    const item = items.find(item => item?.id === selectedId);
    return item?.name || 'None';
  };

  const handleEdit = async (values: handelProductEdit) => {
    try {
      setLoading(true);
      
      const productData = {
        name: values.name,
        price: parseFloat(values.price) || undefined,
        min_stock_threshold: parseInt(values.min_stock_threshold) || undefined,
        unit: values.unit,
        category: values.category as ProductCategory,
        subcategory_id: parseInt(values.subcategory_id) || undefined,
        location_id: parseInt(values.location_id) || undefined,
        source_type: values.source_type as ProductSourceType,
        product_formula_id: values.product_formula_id === '0' ? undefined : parseInt(values.product_formula_id) || undefined,
        // Use detailedProduct which has the latest data instead of original product prop
        purchase_info_id: (detailedProduct as any)?.purchase_info_id || undefined
      };
      
      await dispatch(updateProduct({
        id: detailedProduct?.id!,
        data: productData
      })).unwrap();

      showToast('success', 'Success', 'Product updated successfully');
      setEditMode(false);
      onProductUpdated?.();
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast('error', 'Error', error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.name || 'this product'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await dispatch(deleteProduct(product?.id!)).unwrap();
              showToast('success', 'Success', 'Product deleted successfully');
              onProductUpdated?.();
              handleClose();
            } catch (error: any) {
              showToast('error', 'Error', error.message || 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!product) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {editMode ? 'Edit Product' : 'Product Details'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={editMode ? styles.scrollContentWithButtons : styles.scrollContent}
        >
          {!editMode ? (
            <View style={styles.detailsContainer}>
              <View style={styles.productHeader}>
                <View style={styles.productIcon}>
                  <Package size={32} color="#2563eb" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name || 'Unknown Product'}</Text>
                  <View style={styles.productTags}>
                    <View style={[styles.categoryTag, { backgroundColor: '#eff6ff' }]}>
                      <Text style={[styles.categoryTagText, { color: '#2563eb' }]}>
                        {product.category || 'Unknown'}
                      </Text>
                    </View>
                    <View style={[styles.categoryTag, { backgroundColor: '#f0fdf4' }]}>
                      <Text style={[styles.categoryTagText, { color: '#16a34a' }]}>
                        {product.source_type === 'manufacturing' ? 'Manufacturing' : 'Trading'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.productSubcategory}>
                    {product.subcategory_name || 'No Subcategory'} • ID: {product.id}
                  </Text>
                  {product.formula_name && (
                    <Text style={styles.productFormula}>
                      📋 Formula: {product.formula_name}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <DollarSign size={24} color="#059669" />
                  <Text style={styles.detailLabel}>Price per Unit</Text>
                  <Text style={styles.detailValue}>₹{(parseFloat(product.price?.toString()) || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <CircleDollarSign size={24} color="#0ea5e9" />
                  <Text style={styles.detailLabel}>Total Value</Text>
                  <Text style={styles.detailValue}>₹{((product as any).total_value || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <TrendingUp size={24} color="#16a34a" />
                  <Text style={styles.detailLabel}>Current Stock</Text>
                  <Text style={styles.detailValue}>{(product as any).current_stock || 0} {product.unit}</Text>
                </View>

                <View style={styles.detailCard}>
                  <AlertTriangle size={24} color="#f59e0b" />
                  <Text style={styles.detailLabel}>Min Threshold</Text>
                  <Text style={styles.detailValue}>{product.min_stock_threshold || 0} {product.unit}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Ruler size={24} color="#8b5cf6" />
                  <Text style={styles.detailLabel}>Unit</Text>
                  <Text style={styles.detailValue}>{product.unit || 'N/A'}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Package size={24} color="#6b7280" />
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{product.location_name || 'No Location'}</Text>
                </View>
              </View>

              {product.description && (
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{product.description}</Text>
                </View>
              )}

              {/* Formula Management Section */}
              <View style={styles.formulaManagementCard}>
                <View style={styles.formulaManagementHeader}>
                  <View style={styles.formulaHeaderLeft}>
                    <Beaker size={24} color="#059669" />
                    <Text style={styles.formulaManagementTitle}>Manufacturing Formula</Text>
                  </View>
                  {productFormula && (
                    <IfMaster>
                      <View style={styles.formulaActions}>
                        <TouchableOpacity 
                          style={styles.formulaIconButton}
                          onPress={() => {
                            if (productFormula) {
                              // Use CreateFormulaModal edit logic pattern
                              setEditingFormula(productFormula);
                              setShowFormulaModal(true);
                            }
                          }}
                        >
                          <Edit size={16} color="#2563eb" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.formulaIconButton}
                          onPress={() => {
                            Alert.alert(
                              'Delete Formula',
                              `Are you sure you want to permanently delete the formula "${productFormula.name}"?\n\nThis will remove the formula from the database and unassign it from this product. This action cannot be undone.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Delete', 
                                  style: 'destructive',
                                  onPress: async () => {
                                    if (!product || !productFormula) return;
                                    
                                    try {
                                      // First, update the product to remove formula reference
                                      await dispatch(updateProduct({
                                        id: product.id,
                                        data: { product_formula_id: null }
                                      })).unwrap();
                                      
                                      // Then, delete the actual formula record from the database
                                      const { deleteFormula } = await import('../../store/slices/formulasSlice');
                                      await dispatch(deleteFormula(productFormula.id)).unwrap();
                                      
                                      // Simply update the detailedProduct with the product that has no formula
                                      // Use undefined instead of null for formula_name to match the type
                                      const updatedProduct = {...product, product_formula_id: null, formula_name: undefined};
                                      setDetailedProduct(updatedProduct as ProductModalItem);
                                      setProductFormula(null);
                                      
                                      showToast('success', 'Success', 'Formula deleted successfully');
                                      
                                      onProductUpdated?.();
                                    } catch (error: any) {
                                      showToast('error', 'Error', error.message || 'Failed to delete formula');
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </IfMaster>
                  )}
                </View>

                {/* Add Formula Button for products without formulas */}
                {!productFormula && product.source_type === 'manufacturing' && (
                  <IfMaster>
                    <TouchableOpacity 
                      style={styles.addFormulaButton}
                      onPress={() => {
                        setEditingFormula(null);
                        setShowFormulaModal(true);
                      }}
                    >
                      <Plus size={16} color="#2563eb" />
                      <Text style={styles.addFormulaText}>Add Formula</Text>
                    </TouchableOpacity>
                  </IfMaster>
                )}

                {productFormula ? (
                  <>
                  <View style={styles.formulaInfo}>
                    <Text style={styles.formulaName}>{productFormula.name}</Text>
                    {productFormula.description && (
                      <Text style={styles.formulaDescription}>{productFormula.description}</Text>
                    )}
                  </View>

                  {productFormula.components && productFormula.components.length > 0 && (
                    <View style={styles.componentsSection}>
                      <Text style={styles.componentsTitle}>Components Required:</Text>
                      {productFormula.components.map((component: any, index: number) => (
                        <View key={component?.id || index} style={styles.componentItem}>
                          <View style={styles.componentDot} />
                          <Text style={styles.componentName}>{component?.component_name || 'Unknown Component'}</Text>
                          <Text style={styles.componentQuantity}>{component?.quantity || 0} units</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.formulaMeta}>
                    <Text style={styles.formulaMetaText}>
                      Created: {productFormula.created_at ? new Date(productFormula.created_at).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </View>
                  </>
                ) : (
                  <View style={styles.noFormulaState}>
                    <Text style={styles.noFormulaText}>No formula assigned to this product</Text>
                    <Text style={styles.noFormulaSubtext}>
                      {product.source_type === 'manufacturing' 
                        ? 'Create a formula to define the manufacturing process'
                        : 'This trading product does not require a formula'
                      }
                    </Text>
                </View>
              )}
              </View>

              {/* Supplier Information Dropdown Section */}
              <View style={styles.supplierCard}>
                <View style={styles.supplierHeader}>
                  <TouchableOpacity 
                    style={styles.supplierHeaderLeft}
                    onPress={() => setSupplierExpanded(!supplierExpanded)}
                  >
                    <Package size={20} color="#059669" />
                    <Text style={styles.supplierTitle}>Supplier Information</Text>
                  </TouchableOpacity>
                  <View style={styles.supplierHeaderRight}>
                    {detailedProduct?.purchase_business_name && (
                      <IfMaster>
                        <TouchableOpacity 
                          style={styles.supplierDeleteButton}
                          onPress={handleSupplierDelete}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </IfMaster>
                    )}
                    <TouchableOpacity 
                      onPress={() => setSupplierExpanded(!supplierExpanded)}
                    >
                      {supplierExpanded ? (
                        <ChevronUp size={20} color="#6b7280" />
                      ) : (
                        <ChevronDown size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                {supplierExpanded && (
                  <View style={styles.supplierInfo}>
                    {detailedProduct?.purchase_business_name ? (
                      <>
                        <Text style={styles.supplierBusinessName}>{detailedProduct.purchase_business_name}</Text>
                        {detailedProduct.purchase_address && (
                          <Text style={styles.supplierContact}>Address: {detailedProduct.purchase_address}</Text>
                        )}
                        {detailedProduct.purchase_email && (
                          <Text style={styles.supplierEmail}>Email: {detailedProduct.purchase_email}</Text>
                        )}
                        {detailedProduct.purchase_phone && (
                          <Text style={styles.supplierPhone}>Phone: {detailedProduct.purchase_phone}</Text>
                        )}
                        {detailedProduct.purchase_gst && (
                          <Text style={styles.supplierPhone}>GST: {detailedProduct.purchase_gst}</Text>
                        )}
                      </>
                    ) : (
                      <View style={styles.noSupplierState}>
                        <Text style={styles.noSupplierText}>No supplier assigned</Text>
                        <Text style={styles.noSupplierSubtext}>
                          This product is not linked to any supplier
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Product Information</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Created:</Text>
                  <Text style={styles.metaValue}>
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Updated:</Text>
                  <Text style={styles.metaValue}>
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                {product.formula_name && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Formula:</Text>
                    <Text style={styles.metaValue}>{product.formula_name}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <Formik
              initialValues={{
                name: detailedProduct?.name || '',
                price: detailedProduct?.price?.toString() || '',
                min_stock_threshold: detailedProduct?.min_stock_threshold?.toString() || '',
                unit: detailedProduct?.unit || '',
                category: detailedProduct?.category || 'raw',
                subcategory_id: detailedProduct?.subcategory_id?.toString() || '0',
                location_id: detailedProduct?.location_id?.toString() || '0',
                source_type: detailedProduct?.source_type || 'trading',
                product_formula_id: detailedProduct?.product_formula_id?.toString() || '0',
              }}
              enableReinitialize={true}
              validationSchema={validationSchema}
              onSubmit={handleEdit}
            >
              {({ handleChange, handleSubmit, values, errors, touched, setFieldValue, isValid, dirty }) => (
                <View style={styles.formContainer}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    
                    <TextInput
                      label="Product Name*"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      mode="outlined"
                      style={styles.input}
                      error={touched.name && !!errors.name}
                    />
                    {touched.name && errors.name && (
                      <Text style={styles.errorText}>{String(errors.name)}</Text>
                    )}

                    <TextInput
                      label="Unit*"
                      value={values.unit}
                      onChangeText={handleChange('unit')}
                      mode="outlined"
                      style={styles.input}
                      error={touched.unit && !!errors.unit}
                    />
                    {touched.unit && errors.unit && (
                      <Text style={styles.errorText}>{String(errors.unit)}</Text>
                    )}

                    <TextInput
                      label="Price per Unit*"
                      value={values.price}
                      onChangeText={handleChange('price')}
                      mode="outlined"
                      style={styles.input}
                      keyboardType="numeric"
                      error={touched.price && !!errors.price}
                    />
                    {touched.price && errors.price && (
                      <Text style={styles.errorText}>{String(errors.price)}</Text>
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
                          <Picker.Item label="Semi-Finished" value="semi-finished" />
                          <Picker.Item label="Finished Product" value="finished" />
                        </Picker>
                      </View>
                      {values.category && (
                        <View style={styles.selectionIndicator}>
                          <Check size={16} color="#10b981" />
                          <Text style={styles.selectedStatus}>
                            {values.category === 'raw' ? 'Raw Material' : 
                             values.category === 'semi-finished' ? 'Semi-Finished' : 'Finished Product'} selected
                          </Text>
                        </View>
                      )}
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
                      {values.source_type && (
                        <View style={styles.selectionIndicator}>
                          <Check size={16} color="#10b981" />
                          <Text style={styles.selectedStatus}>
                            {values.source_type === 'trading' ? 'Trading' : 'Manufacturing'} selected
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location & Category</Text>
                    
                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>Subcategory*</Text>
                      <View style={[styles.picker, parseInt(values.subcategory_id) > 0 && styles.selectedPicker]}>
                        <Picker
                          selectedValue={values.subcategory_id}
                          onValueChange={(value) => setFieldValue('subcategory_id', value)}
                        >
                          <Picker.Item label="Select Subcategory" value="0" />
                          {subcategories?.map((subcategory) => (
                            <Picker.Item
                              key={subcategory.id}
                              label={subcategory.name}
                              value={subcategory.id.toString()}
                            />
                          ))}
                        </Picker>
                      </View>
                      {parseInt(values.subcategory_id) > 0 ? (
                        <View style={styles.selectionIndicator}>
                          <Check size={16} color="#10b981" />
                          <Text style={styles.selectedStatus}>
                            {getSelectedItemName(subcategories, parseInt(values.subcategory_id))} selected
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.unselectedStatus}>No subcategory selected</Text>
                      )}
                    </View>

                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>Location*</Text>
                      <View style={[styles.picker, parseInt(values.location_id) > 0 && styles.selectedPicker]}>
                        <Picker
                          selectedValue={values.location_id}
                          onValueChange={(value) => setFieldValue('location_id', value)}
                        >
                          <Picker.Item label="Select Location" value="0" />
                          {locations?.map((location) => (
                            <Picker.Item
                              key={location.id}
                              label={location.name}
                              value={location.id.toString()}
                            />
                          ))}
                        </Picker>
                      </View>
                      {parseInt(values.location_id) > 0 ? (
                        <View style={styles.selectionIndicator}>
                          <Check size={16} color="#10b981" />
                          <Text style={styles.selectedStatus}>
                            {getSelectedItemName(locations, parseInt(values.location_id))} selected
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.unselectedStatus}>No location selected</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Inventory Settings</Text>
                    
                    <TextInput
                      label="Minimum Stock Threshold*"
                      value={values.min_stock_threshold}
                      onChangeText={handleChange('min_stock_threshold')}
                      mode="outlined"
                      style={styles.input}
                      keyboardType="numeric"
                      error={touched.min_stock_threshold && !!errors.min_stock_threshold}
                    />
                    {touched.min_stock_threshold && errors.min_stock_threshold && (
                      <Text style={styles.errorText}>{String(errors.min_stock_threshold)}</Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manufacturing Formula</Text>
                    
                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>Formula (Optional)</Text>
                      <View style={[styles.picker, parseInt(values.product_formula_id) > 0 && styles.selectedPicker]}>
                        <Picker
                          selectedValue={values.product_formula_id}
                          onValueChange={(value) => setFieldValue('product_formula_id', value)}
                        >
                          <Picker.Item label="No Formula" value="0" />
                          {formulas?.map((formula) => (
                            <Picker.Item
                              key={formula.id}
                              label={formula.name}
                              value={formula.id.toString()}
                            />
                          ))}
                        </Picker>
                      </View>
                      {parseInt(values.product_formula_id) > 0 ? (
                        <View style={styles.selectionIndicator}>
                          <Check size={16} color="#10b981" />
                          <Text style={styles.selectedStatus}>
                            {getSelectedItemName(formulas, parseInt(values.product_formula_id))} selected
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.unselectedStatus}>No formula selected</Text>
                      )}
                    </View>
                  </View>
                  
                  {/* Debug information */}
                  <Text style={{ display: 'none' }}>{JSON.stringify(values)}</Text>
                  
                  {/* Form Buttons */}
                  <View style={styles.formButtonsContainer}>
                    <View style={styles.formButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setEditMode(false);
                        }}
                        style={styles.cancelButton}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => {
                          handleSubmit();
                        }}
                        style={styles.saveButton}
                        loading={loading}
                      >
                        Save Changes
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            </Formik>
          )}
        </ScrollView>

        {/* Action Buttons - Master Only */}
        {isMaster && !editMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(true)}
              disabled={loading}
            >
              <Edit size={20} color="#2563eb" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={loading}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formula Modal */}
        <CreateFormulaModal
          isVisible={showFormulaModal}
          onClose={() => {
            setShowFormulaModal(false);
            setEditingFormula(null);
          }}
          editingFormula={editingFormula}
          onSuccess={async (formula) => {
            try {
              // If this is a new formula (not editing), assign it to the product
              if (!editingFormula && formula && product) {
                const updateData = {
                  name: product.name,
                  price: parseFloat((product.price || 0).toString()) || 0,
                  min_stock_threshold: parseInt((product.min_stock_threshold || 0).toString()) || 0,
                  unit: product.unit,
                  category: product.category as any,
                  subcategory_id: parseInt((product.subcategory_id || 0).toString()) || 0,
                  location_id: parseInt((product.location_id || 0).toString()) || 0,
                  source_type: product.source_type as any,
                  product_formula_id: formula.id // Assign the newly created formula
                };
                
                await dispatch(updateProduct({
                  id: product.id!,
                  data: updateData
                })).unwrap();
                
                // Update the local product object to reflect the new formula ID
                if (product) {
                  product.product_formula_id = formula.id;
                }
                
                // Fetch the complete formula data to ensure we have all fields
                try {
                  const formulaResponse = await dispatch(fetchFormulaById(formula.id)).unwrap();
                  setProductFormula(formulaResponse.data);
                } catch (fetchError) {
                  // If fetch fails, still set the basic formula data
                  setProductFormula(formula);
                }
                
                showToast('success', 'Success', 'Formula created and assigned to product');
              } else if (editingFormula) {
                showToast('success', 'Success', 'Formula updated successfully');
              }
              
              // Refresh formulas list
              dispatch(fetchFormulas());
              
              // Only fetch formula by ID for editing scenarios
              if (editingFormula && product?.product_formula_id) {
                try {
                  const response = await dispatch(fetchFormulaById(product.product_formula_id)).unwrap();
                  setProductFormula(response.data);
                } catch (fetchError) {
                  setProductFormula(null);
                }
              }
              
              onProductUpdated?.();
            } catch (error: any) {
              console.error('Formula operation error:', error);
              showToast('error', 'Error', error.message || 'Failed to assign formula to product');
            }
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithButtons: {
    paddingBottom: 100, // Extra space for fixed buttons
  },
  detailsContainer: {
    gap: 20,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  productTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productSubcategory: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  productFormula: {
    fontSize: 13,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  metaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaKey: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  formContainer: {
    gap: 16,
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
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
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
  selectedPicker: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
    minHeight: 56,
  },
  input: {
    backgroundColor: 'white',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
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
    minHeight: 56,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
  },
  formButtonsContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    gap: 8,
  },
  editButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  formulaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  formulaInfo: {
    marginBottom: 16,
  },
  formulaName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  formulaDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  componentsSection: {
    marginBottom: 12,
  },
  componentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  componentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  componentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 10,
  },
  componentName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  componentQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  formulaMeta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  formulaMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Formula Management Styles
  formulaManagementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formulaManagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formulaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formulaManagementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  formulaActions: {
    flexDirection: 'row',
    gap: 6,
  },
  formulaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formulaIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginLeft: 8,
  },
  addFormulaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginTop: 12,
    gap: 6,
  },
  addFormulaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  formulaDeleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  formulaActionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  formulaDeleteText: {
    color: '#ef4444',
  },
  noFormulaState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFormulaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  noFormulaSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // Supplier Information Styles
  supplierCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  supplierHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  supplierHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  supplierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  supplierDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginRight: 4,
  },
  supplierInfo: {
    gap: 6,
  },
  supplierBusinessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  supplierContact: {
    fontSize: 14,
    color: '#374151',
  },
  supplierEmail: {
    fontSize: 14,
    color: '#374151',
  },
  supplierPhone: {
    fontSize: 14,
    color: '#374151',
  },
  noSupplierState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSupplierText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  noSupplierSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 