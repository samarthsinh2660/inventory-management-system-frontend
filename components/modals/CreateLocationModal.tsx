import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createLocation, updateLocation } from '../../store/slices/locationsSlice';
import Toast from 'react-native-toast-message';

interface CreateLocationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (location: any) => void;
  editingLocation?: any;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  address: Yup.string(),
});

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  editingLocation,
}) => {
  const dispatch = useAppDispatch();
  const isEditing = !!editingLocation;

  const handleSubmit = async (values: { name: string; address: string }) => {
    try {
      let result;
      if (isEditing) {
        result = await dispatch(updateLocation({
          id: editingLocation.id,
          data: values
        })).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Location updated successfully',
        });
      } else {
        result = await dispatch(createLocation(values)).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Location created successfully',
        });
      }
      onSuccess?.(result);
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || `Failed to ${isEditing ? 'update' : 'create'} location`,
      });
    }
  };

  const getInitialValues = () => {
    if (isEditing && editingLocation) {
      return {
        name: editingLocation.name || '',
        address: editingLocation.address || '',
      };
    }
    return { name: '', address: '' };
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Location' : 'Create Location'}
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
                label="Name*"
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
                label="Address"
                value={values.address}
                onChangeText={handleChange('address')}
                onBlur={handleBlur('address')}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

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
    maxHeight: '80%',
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