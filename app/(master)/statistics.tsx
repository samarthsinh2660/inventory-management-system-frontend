import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import Statistics from '../(shared)/statistics';
import { UserRole } from '@/types/user';

export default function ProtectedStatisticsScreen() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const isMaster = user?.role === UserRole.MASTER;
  
  useEffect(() => {
    // If not a master user, redirect to dashboard
    if (!isMaster) {
      router.replace('/');
    }
  }, [isMaster, router]);

  // Only render the Statistics component if user is a master
  return isMaster ? <Statistics /> : null;
}
