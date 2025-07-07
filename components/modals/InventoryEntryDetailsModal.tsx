import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { TextInput, Button, Chip } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import { X, Edit, Package, TrendingUp, TrendingDown, MapPin, User, Calendar, FileText, Hash } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { updateInventoryEntry } from '../../store/slices/inventorySlice';
import { formatEntryType, getEntryTypeColor, getEntryTypeBackgroundColor } from '../../utils/helperFunctions';
import Toast from 'react-native-toast-message';
import { InventoryEntryDetailsModalProps, InventoryEntryType } from '@/types/inventory';
import { UserRole } from '@/types/user';

const validationSchema = Yup.object({
  quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
  entry_type: Yup.string().required('Entry type is required'),
  location_id: Yup.number().min(1, 'Location is required').required('Location is required'),
  notes: Yup.string(),
  reference_id: Yup.string(),
});

export default function InventoryEntryDetailsModal({ visible, onClose, entry }: InventoryEntryDetailsModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const locations = useAppSelector(state => state.locations.list || []);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMaster = user?.role === UserRole.MASTER;
  const canEdit = isMaster || (entry && entry.user_id === user?.id);

  if (!entry) return null;

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      // Create update object with only changed fields
      const updateData: any = {};
      
      if (values.quantity !== entry.quantity) updateData.quantity = parseFloat(values.quantity);
      if (values.entry_type !== entry.entry_type) updateData.entry_type = values.entry_type;
      if (values.location_id !== entry.location_id) updateData.location_id = values.location_id;
      if (values.notes !== (entry.notes || '')) updateData.notes = values.notes;
      if (values.reference_id !== (entry.reference_id || '')) updateData.reference_id = values.reference_id;

      // Only send update if there are changes
      if (Object.keys(updateData).length > 0) {
        await dispatch(updateInventoryEntry({ id: entry.id, data: updateData })).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Inventory entry updated successfully',
        });
        setEditMode(false);
      } else {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'No changes were made to update',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update inventory entry',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeIcon = (entryType: string) => {
    return entryType && entryType.includes('in') ? (
      <TrendingUp size={24} color={getEntryTypeColor(entryType)} />
    ) : (
      <TrendingDown size={24} color={getEntryTypeColor(entryType)} />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {editMode ? 'Edit Entry' : 'Inventory Entry Details'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!editMode ? (
            <View style={styles.detailsContainer}>
              <View style={styles.entryHeader}>
                <View style={[styles.entryIcon, { 
                  backgroundColor: getEntryTypeBackgroundColor(entry.entry_type)
                }]}>
                  {getEntryTypeIcon(entry.entry_type)}
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryType}>{formatEntryType(entry.entry_type) || 'Unknown Type'}</Text>
                  <Text style={styles.entryId}>Entry ID: {entry.id}</Text>
                </View>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>
                    {entry.quantity > 0 ? '+' : ''}{entry.quantity || 0}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Package size={24} color="#2563eb" />
                  <Text style={styles.detailLabel}>Product</Text>
                  <Text style={styles.detailValue}>{entry.product_name || 'Unknown Product'}</Text>
                </View>

                <View style={styles.detailCard}>
                  <MapPin size={24} color="#8b5cf6" />
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{entry.location_name || 'Unknown Location'}</Text>
                </View>

                <View style={styles.detailCard}>
                  <User size={24} color="#059669" />
                  <Text style={styles.detailLabel}>Created By</Text>
                  <Text style={styles.detailValue}>{entry.username || 'Unknown User'}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Calendar size={24} color="#f59e0b" />
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Unknown Date'}
                  </Text>
                </View>
              </View>

              {entry.notes && (
                <View style={styles.notesCard}>
                  <FileText size={20} color="#6b7280" />
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{entry.notes}</Text>
                </View>
              )}

              {entry.reference_id && (
                <View style={styles.referenceCard}>
                  <Hash size={20} color="#6b7280" />
                  <Text style={styles.referenceLabel}>Reference ID</Text>
                  <Text style={styles.referenceText}>{entry.reference_id}</Text>
                </View>
              )}

              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Entry Information</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Product ID:</Text>
                  <Text style={styles.metaValue}>{entry.product_id || 'N/A'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>User ID:</Text>
                  <Text style={styles.metaValue}>{entry.user_id || 'N/A'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Location ID:</Text>
                  <Text style={styles.metaValue}>{entry.location_id || 'N/A'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Created:</Text>
                  <Text style={styles.metaValue}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Updated:</Text>
                  <Text style={styles.metaValue}>
                    {entry.updated_at ? new Date(entry.updated_at).toLocaleString() : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Formik
              initialValues={{
                quantity: entry.quantity?.toString() || '',
                entry_type: entry.entry_type || InventoryEntryType.MANUAL_IN,
                location_id: entry.location_id || 0,
                notes: entry.notes || '',
                reference_id: entry.reference_id || '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleEdit}
            >
              {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
                <View style={styles.formContainer}>
                  <View style={styles.productInfoCard}>
                    <Package size={24} color="#2563eb" />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{entry.product_name || 'Unknown Product'}</Text>
                      <Text style={styles.productNote}>Product cannot be changed</Text>
                    </View>
                  </View>

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
                    {touched.entry_type && errors.entry_type && (
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
                    error={touched.quantity && !!errors.quantity}
                  />
                  {touched.quantity && errors.quantity && (
                    <Text style={styles.errorText}>{String(errors.quantity)}</Text>
                  )}

                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Location</Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={values.location_id?.toString() || '0'}
                        onValueChange={(itemValue) => {
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
                    {touched.location_id && errors.location_id && (
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
                    numberOfLines={3}
                  />

                  <TextInput
                    label="Reference ID (Optional)"
                    value={values.reference_id}
                    onChangeText={handleChange('reference_id')}
                    mode="outlined"
                    style={styles.input}
                  />

                  <View style={styles.formButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setEditMode(false)}
                      style={styles.cancelButton}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => handleSubmit()}
                      style={styles.saveButton}
                      loading={loading}
                    >
                      Save Changes
                    </Button>
                  </View>
                </View>
              )}
            </Formik>
          )}
        </ScrollView>

        {/* Edit Button - Only if user can edit */}
        {canEdit && !editMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(true)}
              disabled={loading}
            >
              <Edit size={20} color="#2563eb" />
              <Text style={styles.editButtonText}>Edit Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  detailsContainer: {
    gap: 20,
  },
  entryHeader: {
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
  entryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  entryInfo: {
    flex: 1,
  },
  entryType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  entryId: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quantityBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 8,
  },
  referenceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  referenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginLeft: 8,
  },
  referenceText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
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
  productInfoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  productInfo: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  productNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pickerContainer: {
    marginBottom: 4,
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
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  editButton: {
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
}); 