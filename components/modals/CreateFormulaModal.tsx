import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { X, Plus, Minus } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { createFormula, updateFormula} from '../../store/slices/formulasSlice';
import Toast from 'react-native-toast-message';
import { CreateFormulaData } from '@/types/product';
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

export const CreateFormulaModal: React.FC<CreateFormulaModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  editingFormula,
}) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.products.list);
  const isEditing = !!editingFormula;

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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Formula updated successfully',
        });
      } else {
        result = await dispatch(createFormula(formulaData)).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Formula created successfully',
      });
      }
      onSuccess?.(result.data);
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || `Failed to ${isEditing ? 'update' : 'create'} formula`,
      });
    }
  };

  const getInitialValues = () => {
    if (isEditing && editingFormula) {
      return {
        name: editingFormula.name || '',
        description: editingFormula.description || '',
        components: editingFormula.components && editingFormula.components.length > 0 
          ? editingFormula.components.map((comp, index: number) => ({
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
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <TextInput
                label="Formula Name*"
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

              <Text style={styles.sectionTitle}>Components</Text>

              <FieldArray name="components">
                {({ push, remove }) => (
                  <View>
                    {values.components.map((component, index: number) => (
                      <View key={index} style={styles.componentRow}>
                        <View style={styles.pickerContainer}>
                          <Text style={styles.label}>Product*</Text>
                          <View style={styles.picker}>
                            <Picker
                              selectedValue={component.component_id}
                              onValueChange={(value) =>
                                setFieldValue(`components.${index}.component_id`, value)
                              }
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

                        <View style={styles.quantityContainer}>
                          <TextInput
                            label="Quantity*"
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
                          <Minus size={20} color={values.components.length === 1 ? '#d1d5db' : '#ef4444'} />
                        </TouchableOpacity>
                      </View>
                    ))}

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
    maxHeight: 400,
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
});