import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppSelector } from '../hooks/useAppSelector';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Index() {
  const router = useRouter();
  const { accessToken, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (accessToken && user) {
      // Redirect based on user role
      if (user.role === 'master') {
        router.replace('/(master)' as any);
      } else {
        router.replace('/(employee)' as any);
      }
    } else {
      router.replace('/login');
    }
  }, [accessToken, user, router]);

  return (
    <View style={styles.container}>
      <LoadingSpinner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});