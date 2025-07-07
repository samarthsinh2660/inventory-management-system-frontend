import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Package, Info } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { signin } from '../../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import { UserRole } from '@/types/user';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      const result = await dispatch(signin(values)).unwrap();
      // Redirect based on user role
      if (result.user.role === UserRole.MASTER) {
        router.replace('/(master)');
      } else {
        router.replace('/(employee)');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Invalid credentials',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Package size={48} color="#2563eb" />
            </View>
            <Text style={styles.title}>Inventory Manager</Text>
            <Text style={styles.subtitle}>Sign in to access your inventory system</Text>
            
            <TouchableOpacity 
              style={styles.demoInfoButton}
              onPress={() => router.push('/demo-info')}
            >
              <Info size={16} color="#2563eb" />
              <Text style={styles.demoInfoText}>Demo Credentials</Text>
            </TouchableOpacity>
          </View>

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <View style={styles.form}>
                <TextInput
                  label="Username"
                  value={values.username}
                  onChangeText={handleChange('username')}
                  onBlur={handleBlur('username')}
                  error={touched.username && !!errors.username}
                  style={styles.input}
                  autoCapitalize="none"
                />
                {touched.username && errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}

                <TextInput
                  label="Password"
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

                <Button
                  mode="contained"
                  onPress={() => handleLogin(values)}
                  loading={loading}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                >
                  Sign In
                </Button>
              </View>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  demoInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  demoInfoText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '500',
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
  loginButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  quickLogin: {
    marginTop: 24,
    alignItems: 'center',
  },
  quickLoginTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLoginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickLoginButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quickLoginButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  quickLoginButtonTextSecondary: {
    color: '#374151',
  },
});