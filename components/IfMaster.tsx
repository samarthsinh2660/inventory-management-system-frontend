import React from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { IfMasterProps, UserRole } from '@/types/user';

export const IfMaster: React.FC<IfMasterProps> = ({ children, fallback = null }) => {
  const user = useAppSelector(state => state.auth.user);
  
  if (!user || user.role !== UserRole.MASTER) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};