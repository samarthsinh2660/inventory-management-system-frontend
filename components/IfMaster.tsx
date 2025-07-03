import React from 'react';
import { useAppSelector } from '../hooks/useAppSelector';

interface IfMasterProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const IfMaster: React.FC<IfMasterProps> = ({ children, fallback = null }) => {
  const user = useAppSelector(state => state.auth.user);
  
  if (!user || user.role !== 'master') {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};