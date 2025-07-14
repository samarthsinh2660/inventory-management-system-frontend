

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchNotifications, resolveAlert, checkAlerts} from '../../store/slices/alertsSlice';
import { createInventoryEntry, fetchInventoryBalance } from '../../store/slices/inventorySlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import ResolveAlertModal from '../../components/modals/ResolveAlertModal';
import Toast from 'react-native-toast-message';
import { Notification } from '@/types/alerts';
import { InventoryEntryType, CreateInventoryEntryData } from '@/types/inventory';

export default function Alerts() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, loading } = useAppSelector(state => state.alerts);
  const products = useAppSelector(state => state.products.list);
  const locations = useAppSelector(state => state.locations.list);
  const unresolvedCount = useAppSelector(state => 
    state.alerts.notifications.filter(notification => !notification.is_read).length
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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
    dispatch(fetchProducts({ page: 1, limit: 100 }));
    dispatch(fetchLocations());
  }, [dispatch]);

  const handleResolveClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowResolveModal(true);
  };

  const handleResolveAlert = async (quantity: number) => {
    if (!selectedNotification) return;

    try {
      // First, find the product and location details
      const product = products.find(p => p.name === selectedNotification.product_name);
      const location = locations.find(l => l.name === selectedNotification.location_name);

      if (!product || !location) {
        throw new Error('Product or location not found');
      }

      // Step 1: Resolve the alert
      await dispatch(resolveAlert(selectedNotification.stock_alert_id)).unwrap();

      // Step 2: Create inventory entry with the specified quantity
      const entryData: CreateInventoryEntryData = {
        product_id: product.id,
        quantity: quantity,
        entry_type: InventoryEntryType.MANUAL_IN,
        location_id: location.id,
        notes: `Auto-generated entry from alert resolution - ${selectedNotification.product_name}`,
        // No reference_id needed for alert resolution
      };

      await dispatch(createInventoryEntry(entryData)).unwrap();

      // Step 3: Refresh inventory balance and notifications
      await Promise.all([
        dispatch(fetchInventoryBalance()),
        dispatch(fetchNotifications())
      ]);

      Toast.show({
        type: 'success',
        text1: 'Alert Resolved',
        text2: `Added ${quantity} units and resolved the alert`,
      });

      setSelectedNotification(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to resolve alert',
      });
      throw error; // Re-throw to handle in modal
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
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertTriangle size={16} color="#ef4444" />
          )}
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.location}>{item.location_name}</Text>
        </View>
        {!item.is_read && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleResolveClick(item)}
          >
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.stockInfo}>
        <Text style={styles.stockText}>
          <Text style={styles.stockLabel}>Current: </Text>
          <Text style={[styles.stockValue, { color: '#ef4444' }]}>{item.current_stock}</Text>
          <Text style={styles.stockLabel}> • Min Required: </Text>
          <Text style={styles.stockValue}>{item.min_threshold}</Text>
        </Text>
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
          <Text style={styles.title}>Stock Alerts</Text>
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

      <ResolveAlertModal
        visible={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        onResolve={handleResolveAlert}
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
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
    marginBottom: 6,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertContent: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 18,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
    lineHeight: 16,
  },
  resolveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resolveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  stockInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    lineHeight: 16,
  },
  stockLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  alertDate: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 2,
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