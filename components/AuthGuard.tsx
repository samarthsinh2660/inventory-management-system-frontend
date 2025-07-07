import React from 'react';
import { View } from 'react-native';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoadingSpinner } from './LoadingSpinner';
import { AuthGuardProps } from '@/types/user';

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  const { isAuthenticated } = useAuthGuard();

  // Show loading while auth check is in progress
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {fallback}
      </View>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}; 