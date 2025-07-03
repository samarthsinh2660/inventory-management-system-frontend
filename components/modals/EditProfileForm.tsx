import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { User } from '../../store/slices/authSlice';
import { updateProfile } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/usersSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';

interface EditProfileFormProps {
  user: User;
  isOwnProfile?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  fieldsToShow?: Array<'name' | 'email' | 'password' | 'username' | 'role'>;
}

export const EditProfileForm = ({
  user,
  isOwnProfile = true,
  onSuccess,
  onCancel,
  fieldsToShow = ['name', 'email', 'password', 'username', 'role']
}: EditProfileFormProps) => {
  const dispatch = useAppDispatch();
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Determine which fields to show
  const showName = fieldsToShow.includes('name');
  const showEmail = fieldsToShow.includes('email');
  const showUsername = fieldsToShow.includes('username'); // Allow username editing for all users
  const showRole = fieldsToShow.includes('role') && !isOwnProfile; // Only allow role change for admins editing others
  const showPassword = fieldsToShow.includes('password');

  // Create validation schema based on the fields to show
  const validationSchema = Yup.object().shape({
    ...(showName && { name: Yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required') }),
    ...(showEmail && { email: Yup.string().email('Please enter a valid email').nullable() }),
    ...(showUsername && { username: Yup.string().trim().min(3, 'Username must be at least 3 characters').required('Username is required') }),
    ...(showPassword && isOwnProfile && {
      currentPassword: Yup.string().min(6, 'Password must be at least 6 characters'),
      newPassword: Yup.string()
        .min(6, 'New password must be at least 6 characters')
        .test('not-same', 'New password must be different', function(value) {
          return !value || value !== this.parent.currentPassword;
        }),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .when('newPassword', {
          is: (val: string) => val?.length > 0,
          then: (schema) => schema.required('Please confirm your new password')
        })
    }),
    ...(showPassword && !isOwnProfile && {
      password: Yup.string().min(6, 'Password must be at least 6 characters')
    })
  });

  // Initial form values
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'employee',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    password: '' // For admin setting user password
  };

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const updateData: any = {};

      // Only include fields with values that have changed
      if (showName && values.name && values.name !== user?.name) {
        updateData.name = values.name;
      }

      if (showEmail && values.email !== user?.email) {
        updateData.email = values.email;
      }
      
      if (showUsername && values.username !== user?.username) {
        updateData.username = values.username;
      }
      
      if (showRole && values.role !== user?.role) {
        updateData.role = values.role;
      }

      // Password handling differs between own profile and admin editing user
      if (showPassword) {
        if (isOwnProfile) {
          // Self profile - need current and new password
          if (values.currentPassword && values.newPassword) {
            updateData.currentPassword = values.currentPassword;
            updateData.newPassword = values.newPassword;
          }
        } else {
          // Admin editing - direct password set
          if (values.password) {
            updateData.password = values.password;
          }
        }
      }

      // If there's nothing to update, show a message
      if (Object.keys(updateData).length === 0) {
        Alert.alert('No Changes', 'You have not made any changes to update.');
        setSubmitting(false);
        return;
      }

      // Use appropriate action based on whether it's own profile or another user
      if (isOwnProfile) {
        const result = await dispatch(updateProfile(updateData)).unwrap();
        Alert.alert('Success', 'Your profile has been updated successfully.');
      } else {
        const result = await dispatch(updateUser({ 
          userId: user.id, 
          userData: updateData 
        })).unwrap();
        Alert.alert('Success', `User ${user.username}'s profile has been updated successfully.`);
      }

      resetForm();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error.message || 'There was a problem updating the profile. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, isSubmitting }) => (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isOwnProfile ? 'Update Your Profile' : `Update ${user.username}'s Profile`}
          </Text>

          {showName && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                placeholder="Enter name"
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
          )}

          {showEmail && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          )}

          {showUsername && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                placeholder="Enter username"
                autoCapitalize="none"
              />
              {touched.username && errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>
          )}

          {showRole && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleContainer}>
                <Text>Employee</Text>
                <Switch
                  value={values.role === 'master'}
                  onValueChange={(value) => {
                    setFieldValue('role', value ? 'master' : 'employee');
                  }}
                  trackColor={{ false: '#d1d5db', true: '#bfdbfe' }}
                  thumbColor={values.role === 'master' ? '#2563eb' : '#9ca3af'}
                />
                <Text>Master</Text>
              </View>
              <Text style={styles.roleHint}>
                {values.role === 'master' ? 
                  'Master users have full administrative access' : 
                  'Employee users have limited access'}
              </Text>
            </View>
          )}

          {/* Different password fields for self vs admin editing */}
          {showPassword && isOwnProfile && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={values.currentPassword}
                  onChangeText={handleChange('currentPassword')}
                  onBlur={handleBlur('currentPassword')}
                  placeholder="Enter current password"
                  secureTextEntry={!showPasswordFields}
                />
                {touched.currentPassword && errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={values.newPassword}
                  onChangeText={handleChange('newPassword')}
                  onBlur={handleBlur('newPassword')}
                  placeholder="Enter new password"
                  secureTextEntry={!showPasswordFields}
                />
                {touched.newPassword && errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  placeholder="Confirm new password"
                  secureTextEntry={!showPasswordFields}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </>
          )}

          {/* Admin setting user password */}
          {showPassword && !isOwnProfile && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Set New Password</Text>
              <TextInput
                style={styles.input}
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Enter new password for user"
                secureTextEntry={!showPasswordFields}
              />
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
          )}

          {/* Password visibility toggle */}
          {showPassword && (
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowPasswordFields(!showPasswordFields)}
            >
              <Text style={styles.toggleText}>
                {showPasswordFields ? 'Hide Password' : 'Show Password'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={() => handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#4b5563',
  },
  toggleButton: {
    marginBottom: 16,
  },
  toggleText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  roleHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});