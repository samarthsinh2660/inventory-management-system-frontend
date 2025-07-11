import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, RotateCcw, Plus, Minus, CreditCard as Edit, Filter } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAuditLogs, deleteAuditLog } from '../../store/slices/auditLogsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import Toast from 'react-native-toast-message';
import { UserRole } from '@/types/user';
import { AuditAction, AuditLog } from '@/types/log';

export default function AuditLogs() {
  const dispatch = useAppDispatch();
  const { list: auditLogs = [], loading } = useAppSelector(state => state.auditLogs);
  const user = useAppSelector(state => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [showMyLogsOnly, setShowMyLogsOnly] = useState(false);

  const isMaster = user?.role === UserRole.MASTER;

  // Filter logs based on user role and filter setting
  const filteredLogs = isMaster 
    ? (showMyLogsOnly ? auditLogs.filter(log => log.username === user?.username) : auditLogs)
    : auditLogs.filter(log => log.username === user?.username);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAuditLogs({}));
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAuditLogs({}));
  }, [dispatch]);


  const handleRevertChange = async (logId: number) => {
    try {
      await dispatch(deleteAuditLog({ id: logId})).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Change Reverted',
        text2: 'The change has been successfully reverted',
      });
      // Refresh the list after successful revert
      dispatch(fetchAuditLogs({}));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to revert change',
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case AuditAction.CREATE.toUpperCase():
        return <Plus size={16} color="#10b981" />;
      case AuditAction.UPDATE.toUpperCase():
        return <Edit size={16} color="#f59e0b" />;
      case AuditAction.DELETE.toUpperCase():
        return <Minus size={16} color="#ef4444" />;
      default:
        return <FileText size={16} color="#6b7280" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case AuditAction.CREATE.toUpperCase():
        return '#10b981';
      case AuditAction.UPDATE.toUpperCase():
        return '#f59e0b';
      case AuditAction.DELETE.toUpperCase():
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Format object values into readable text
  const formatObjectValues = (values: any) => {
    if (!values) return null;
    
    return Object.entries(values).map(([key, value]) => {
      // Skip internal fields for cleaner display
      if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;
      
      const formattedValue = value === null ? 'null' : 
                           value === undefined ? 'undefined' : 
                           typeof value === 'object' ? JSON.stringify(value, null, 2) : 
                           String(value);
      
      return (
        <View style={styles.valueRow} key={key}>
          <Text style={styles.valueKey}>{key}:</Text>
          <Text style={styles.valueText}>{formattedValue}</Text>
        </View>
      );
    }).filter(Boolean); // Filter out null values
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEntryTypeStyle = (entryType: string | undefined) => {
    if (!entryType) return {};
    
    let backgroundColor = '#f0f9ff';
    let textColor = '#0369a1';
    
    if (entryType.includes('in')) {
      backgroundColor = '#f0fdf4';
      textColor = '#16a34a';
    } else if (entryType.includes('out')) {
      backgroundColor = '#fef2f2';
      textColor = '#dc2626';
    }
    
    if (entryType.includes('manufacturing')) {
      textColor = '#9333ea'; // Purple for manufacturing
    }
    
    return { backgroundColor, textColor };
  };

  const renderAuditLog = ({ item }: { item: AuditLog }) => {
    // Extract the entry_type from new_data if available
    const entryType = item.new_data?.entry_type;
    const entryTypeStyles = getEntryTypeStyle(entryType);
    
    // Get product name or ID for better identification
    const productName = item.new_data?.product_name || 
                       (item.new_data?.product_id ? `Product #${item.new_data.product_id}` : '');
    
    // Get entry quantity for display
    const quantity = item.new_data?.quantity !== undefined ? `${item.new_data.quantity}` : '';

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(item.action)}15` }]}>
              {getActionIcon(item.action)}
              <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>
                {item.action}
              </Text>
            </View>
            
            {entryType && (
              <View style={[styles.entryTypeBadge, { backgroundColor: entryTypeStyles.backgroundColor }]}>
                <Text style={[styles.entryTypeText, { color: entryTypeStyles.textColor }]}>
                  {entryType.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        <View style={styles.logContent}>
          <View style={styles.contentRow}>
            <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
              {productName || 'Unknown Product'}
            </Text>
            {quantity && (
              <Text style={styles.quantityBadge}>
                {quantity} {item.new_data?.unit || 'units'}
              </Text>
            )}
          </View>
          
          <View style={styles.infoRow}>
            {item.entry_id && (
              <Text style={styles.infoText}>Entry #{item.entry_id}</Text>
            )}
            <Text style={styles.usernameText}>By: {item.username}</Text>
            {item.reason && (
              <Text style={styles.reasonText} numberOfLines={1}>
                Reason: {item.reason}
              </Text>
            )}
          </View>
        </View>

        {(item.old_data || item.new_data) && (
          <View style={styles.valuesContainer}>
            {item.old_data && (
              <View style={styles.valuesSection}>
                <Text style={styles.valuesTitle}>Previous Data:</Text>
                <View style={styles.valuesList}>
                  {formatObjectValues(item.old_data)}
                </View>
              </View>
            )}
            {item.new_data && Object.keys(item.new_data).length > 0 && (
              <View style={styles.valuesSection}>
                <Text style={styles.valuesTitle}>Details:</Text>
                <View style={styles.valuesList}>
                  {formatObjectValues(item.new_data)}
                </View>
              </View>
            )}
          </View>
        )}

        {(isMaster || (!isMaster && item.username === user?.username)) && (
          <TouchableOpacity
            style={styles.revertButton}
            onPress={() => handleRevertChange(item.id)}
            disabled={loading}
          >
            <RotateCcw size={16} color="#2563eb" />
            <Text style={styles.revertButtonText}>Revert Change</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
        <View style={styles.headerContent}>
          <FileText size={24} color="#2563eb" />
          <View>
            <Text style={styles.title}>
              {isMaster ? 'Audit Logs' : 'My Activity Log'}
            </Text>
            <Text style={styles.subtitle}>
              {isMaster 
                ? `${filteredLogs.length} total entries ${showMyLogsOnly ? '(my entries)' : '(all entries)'}`
                : `${filteredLogs.length} my entries`
              }
            </Text>
          </View>
        </View>
        {isMaster && (
          <TouchableOpacity
            style={[styles.filterButton, showMyLogsOnly && styles.filterButtonActive]}
            onPress={() => setShowMyLogsOnly(!showMyLogsOnly)}
          >
            <Filter size={16} color={showMyLogsOnly ? "#2563eb" : "#6b7280"} />
            <Text style={[styles.filterButtonText, showMyLogsOnly && styles.filterButtonTextActive]}>
              {showMyLogsOnly ? 'My Logs' : 'All Logs'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderAuditLog}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {isMaster ? 'No audit logs found' : 'No activity logs found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isMaster 
                ? 'System changes will appear here'
                : 'Your inventory activities will appear here'
              }
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#2563eb',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logContent: {
    marginBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  quantityBadge: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  usernameText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  valuesContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  valuesSection: {
    marginBottom: 8,
  },
  valuesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  valuesList: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  valueRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  valueKey: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    marginRight: 4,
  },
  valueText: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
    flexWrap: 'wrap',
  },
  revertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  revertButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
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
  },
});