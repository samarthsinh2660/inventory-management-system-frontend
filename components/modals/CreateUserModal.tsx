import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button, Switch } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { signup } from '../../store/slices/authSlice';
import { createUser, fetchUsers } from '../../store/slices/usersSlice';
import Toast from 'react-native-toast-message';
import { useAppSelector } from '../../hooks/useAppSelector';
import { CreateUserData, UserRole, CreateUserModalProps, HandleSubmitProps } from '@/types/user';
import { extractFactoryName } from '@/utils/userUtils';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  email: Yup.string().email('Invalid email format').required('Email is required'),  
  role: Yup.string().oneOf(['master', 'employee']).required('Role is required'),
});

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isVisible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const factoryName = extractFactoryName(currentUser?.username || '');

  // Determine if this is a sign-up or user creation based on if there's a current user
  const isUserCreation = !!currentUser;

  const handleSubmit = async (values: HandleSubmitProps) => {
    try {
      // Ensure email is always a string (empty if not provided)
      const userData = {
        ...values,
      };
      
      if (isUserCreation) {
        // If a user is logged in, use createUser from usersSlice
        await dispatch(createUser(userData as CreateUserData)).unwrap();
      } else {
        // If no user is logged in, use signup from authSlice
        await dispatch(signup(userData as CreateUserData)).unwrap();
      }
      
      // Refresh users list if it's user creation by an admin
      if (isUserCreation) {
        dispatch(fetchUsers());
      }
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: isUserCreation ? 'User created successfully' : 'Account created successfully',
      });
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create user',
      });
    }
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isUserCreation ? 'Create User' : 'Sign Up'}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Formik
          initialValues={{ 
            name: '', 
            username: '', 
            password: '', 
            email: '', 
            role: UserRole.EMPLOYEE 
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
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
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                label="Username*"
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                error={touched.username && !!errors.username}
                style={styles.input}
                autoCapitalize="none"
                placeholder={factoryName ? `Enter username (no @${factoryName} needed)` : 'Enter username (no @factory needed)'}
              />
              {factoryName ? (
                <Text style={styles.hintText}>
                  Full login will be {values.username || 'username'}@{factoryName}. No need to type the @factory part here.
                </Text>
              ) : (
                <Text style={styles.hintText}>
                  No need to include the @factory part while creating a user.
                </Text>
              )}
              {touched.username && errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}

              <TextInput
                label="Password*"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && !!errors.password}
                secureTextEntry
                style={styles.input}
              />
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <TextInput
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && !!errors.email}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>User Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      values.role === UserRole.EMPLOYEE && styles.activeRoleButton
                    ]}
                    onPress={() => setFieldValue('role', UserRole.EMPLOYEE)}
                  >
                    <Text 
                      style={[
                        styles.roleButtonText,
                        values.role === UserRole.EMPLOYEE && styles.activeRoleButtonText
                      ]}
                    >
                      Employee
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      values.role === UserRole.MASTER && styles.activeRoleButton
                    ]}
                    onPress={() => setFieldValue('role', UserRole.MASTER)}
                  >
                    <Text 
                      style={[
                        styles.roleButtonText,
                        values.role === UserRole.MASTER && styles.activeRoleButtonText
                      ]}
                    >
                      Master
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.switchDescription}>
                Master users have full access including product management and user administration.
              </Text>

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
                  {isUserCreation ? 'Create' : 'Sign Up'}
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
  hintText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: -8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  roleSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  roleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  activeRoleButton: {
    backgroundColor: '#2563eb',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeRoleButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: -8,
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