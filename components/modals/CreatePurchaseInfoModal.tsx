import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createPurchaseInfo, updatePurchaseInfo } from '../../store/slices/purchaseInfoSlice';
import Toast from 'react-native-toast-message';
import { CreatePurchaseInfoModalProps } from '@/types/general';

const validationSchema = Yup.object({
  business_name: Yup.string().required('Business name is required'),
  address: Yup.string(),
  phone_number: Yup.string().matches(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format'),
  email: Yup.string().email('Invalid email format'),
  gst_number: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format'),
});

export const CreatePurchaseInfoModal: React.FC<CreatePurchaseInfoModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  editingPurchaseInfo,
}) => {
  const dispatch = useAppDispatch();
  const isEditing = !!editingPurchaseInfo;

  const handleSubmit = async (values: { 
    business_name: string; 
    address: string; 
    phone_number: string; 
    email: string; 
    gst_number: string; 
  }) => {
    try {
      const submitData = {
        business_name: values.business_name,
        address: values.address || null,
        phone_number: values.phone_number || null,
        email: values.email || null,
        gst_number: values.gst_number || null,
      };

      let result;
      if (isEditing) {
        result = await dispatch(updatePurchaseInfo({
          id: editingPurchaseInfo.id,
          data: submitData
        })).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Supplier updated successfully',
        });
      } else {
        result = await dispatch(createPurchaseInfo(submitData)).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Supplier created successfully',
        });
      }
      onSuccess?.(result.data);
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || `Failed to ${isEditing ? 'update' : 'create'} supplier`,
      });
    }
  };

  const getInitialValues = () => {
    if (isEditing && editingPurchaseInfo) {
      return {
        business_name: editingPurchaseInfo.business_name || '',
        address: editingPurchaseInfo.address || '',
        phone_number: editingPurchaseInfo.phone_number || '',
        email: editingPurchaseInfo.email || '',
        gst_number: editingPurchaseInfo.gst_number || '',
      };
    }
    return { 
      business_name: '', 
      address: '', 
      phone_number: '', 
      email: '', 
      gst_number: '' 
    };
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Supplier' : 'Create Supplier'}
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
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <View style={styles.form}>
              <TextInput
                label="Business Name*"
                value={values.business_name}
                onChangeText={handleChange('business_name')}
                onBlur={handleBlur('business_name')}
                error={touched.business_name && !!errors.business_name}
                style={styles.input}
              />
              {touched.business_name && errors.business_name && (
                <Text style={styles.errorText}>{String(errors.business_name)}</Text>
              )}

              <TextInput
                label="Address"
                value={values.address}
                onChangeText={handleChange('address')}
                onBlur={handleBlur('address')}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Phone Number"
                value={values.phone_number}
                onChangeText={handleChange('phone_number')}
                onBlur={handleBlur('phone_number')}
                error={touched.phone_number && !!errors.phone_number}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="+91-9876543210"
              />
              {touched.phone_number && errors.phone_number && (
                <Text style={styles.errorText}>{String(errors.phone_number)}</Text>
              )}

              <TextInput
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && !!errors.email}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="contact@company.com"
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{String(errors.email)}</Text>
              )}

              <TextInput
                label="GST Number"
                value={values.gst_number}
                onChangeText={handleChange('gst_number')}
                onBlur={handleBlur('gst_number')}
                error={touched.gst_number && !!errors.gst_number}
                style={styles.input}
                autoCapitalize="characters"
                placeholder="27ABCDE1234F1Z5"
              />
              {touched.gst_number && errors.gst_number && (
                <Text style={styles.errorText}>{String(errors.gst_number)}</Text>
              )}

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
            </View>
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
    gap: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
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
