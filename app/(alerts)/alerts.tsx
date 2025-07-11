import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchNotifications, resolveAlert, checkAlerts} from '../../store/slices/alertsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import Toast from 'react-native-toast-message';
import { Notification } from '@/types/alerts';

export default function Alerts() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, loading } = useAppSelector(state => state.alerts);
  const unresolvedCount = useAppSelector(state => 
    state.alerts.notifications.filter(notification => !notification.is_read).length
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchNotifications());
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleResolveAlert = async (alertId: number) => {
    try {
      await dispatch(resolveAlert(alertId)).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Alert Resolved',
        text2: 'Alert has been marked as resolved',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to resolve alert',
      });
    }
  };

  const handleRecheckAlerts = async () => {
    try {
      await dispatch(checkAlerts()).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Stock Check Complete',
        text2: 'Stock alerts have been updated',
      });
      // Refresh notifications after checking alerts
      dispatch(fetchNotifications());
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to check stock alerts',
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={[styles.alertCard, item.is_read && styles.resolvedCard]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          {item.is_read ? (
            <CheckCircle size={20} color="#10b981" />
          ) : (
            <AlertTriangle size={20} color="#ef4444" />
          )}
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.location}>{item.location_name}</Text>
        </View>
        {!item.is_read && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleResolveAlert(item.stock_alert_id)}
          >
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.stockInfo}>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Current Stock</Text>
          <Text style={[styles.stockValue, { color: '#ef4444' }]}>
            {item.current_stock}
          </Text>
        </View>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Minimum Required</Text>
          <Text style={styles.stockValue}>{item.min_threshold}</Text>
        </View>
      </View>
      
      <Text style={styles.alertDate}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Stock Notifications</Text>
          <Text style={styles.subtitle}>
            {unresolvedCount} unread notification{unresolvedCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.recheckButton}
          onPress={handleRecheckAlerts}
        >
          <RefreshCw size={20} color="#2563eb" />
          <Text style={styles.recheckButtonText}>Check</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No notifications found</Text>
            <Text style={styles.emptySubtext}>
              All products are above their minimum stock thresholds
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  recheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recheckButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resolvedCard: {
    borderLeftColor: '#10b981',
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  resolveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resolveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  alertDate: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});