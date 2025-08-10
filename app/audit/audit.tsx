import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, RotateCcw, Plus, Minus, CreditCard as Edit, Filter, Flag, ChevronLeft, ChevronUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAuditLogs, deleteAuditLog, flagAuditLog, setFilters, resetFilters } from '../../store/slices/auditLogsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AuditLogFiltersModal } from '../../components/audit/AuditLogFiltersModal';
import { CustomSearchBar } from '../../components/CustomSearchBar';
import { useDebounce } from '../../utils/helperFunctions';
import Toast from 'react-native-toast-message';
import { UserRole } from '@/types/user';
import { AuditAction, AuditLog } from '@/types/log';
import { AuditLogFiltersState } from '@/types/general';
// To suppress specific warnings (not recommended for production)
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

export default function AuditLogs() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list: auditLogs = [], loading, filters: reduxFilters } = useAppSelector(state => state.auditLogs);
  const { list: users = [] } = useAppSelector(state => state.users);
  const { list: locations = [] } = useAppSelector(state => state.locations);
  const { list: subcategories = [] } = useAppSelector(state => state.subcategories);
  const { list: products = [] } = useAppSelector(state => state.products);
  const user = useAppSelector(state => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [showMyLogsOnly, setShowMyLogsOnly] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  // Track which logs have their details expanded
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  // Initialize filter state
  const [localFilters, setLocalFilters] = useState<AuditLogFiltersState>({
    search: '',
    user_id: 0,
    location_id: 0,
    action: '',
    is_flag: null,
    reference_id: '',
    category: '',
    subcategory_id: 0,
    product_id: 0,
    date_from: '',
    date_to: '',
    days: 0,
  });

  const toggleExpanded = useCallback((id: number) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isMaster = user?.role === UserRole.MASTER;

  // Build a single, memoized filters object
  const currentFilters = useMemo<AuditLogFiltersState>(() => ({
    ...localFilters,
    search: debouncedSearchQuery,
    user_id: (showMyLogsOnly && isMaster && user?.id) ? user.id : 0,
    is_flag: showFlaggedOnly ? true : null,
  }), [localFilters, debouncedSearchQuery, showMyLogsOnly, showFlaggedOnly, isMaster, user?.id]);

  // Use all logs since filtering is now done on backend
  const filteredLogs = useMemo(() => auditLogs, [auditLogs]);

  // Fetch required data for filters
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchLocations());
    dispatch(fetchSubcategories(undefined));
    dispatch(fetchProducts({}));
  }, [dispatch]);

  // Single effect: fetch when memoized filters change
  useEffect(() => {
    const apiFilters = {
      ...currentFilters,
      action: currentFilters.action as AuditAction | undefined,
      is_flag: currentFilters.is_flag === null ? undefined : currentFilters.is_flag,
      };
    dispatch(setFilters(apiFilters));
    dispatch(fetchAuditLogs(apiFilters));
  }, [currentFilters, dispatch]);

  // Refocus search input after loading state changes (safeguard for focus drops)
  useEffect(() => {
    if (searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 5);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const apiFilters = {
        ...currentFilters,
        action: currentFilters.action as AuditAction | undefined,
        is_flag: currentFilters.is_flag === null ? undefined : currentFilters.is_flag,
      };
      dispatch(fetchAuditLogs(apiFilters));
    } finally {
      setRefreshing(false);
    }
  }, [currentFilters, dispatch]);

  // Remove extra effects; currentFilters handles all cases

  // Scroll to top functionality
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, []);

  // Handle scroll to show/hide scroll to top button
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 300);
  }, []);

  // Handle filter application
  const handleApplyFilters = useCallback((newFilters: AuditLogFiltersState) => {
    // Update only local UI filters; fetch will be triggered by currentFilters when search/toggles or debouncedSearch change
    setLocalFilters(newFilters);
  }, []);

  // Handle search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    // no fetch here; debounced effect via currentFilters will handle
  }, []);

  // Count active filters
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.user_id > 0) count++;
    if (localFilters.location_id > 0) count++;
    if (localFilters.action) count++;
    if (localFilters.is_flag !== null) count++;
    if (localFilters.reference_id) count++;
    if (localFilters.category) count++;
    if (localFilters.subcategory_id > 0) count++;
    if (localFilters.product_id > 0) count++;
    if (localFilters.date_from) count++;
    if (localFilters.date_to) count++;
    if (localFilters.days > 0) count++;
    return count;
  }, [localFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: AuditLogFiltersState = {
      search: '',
      user_id: 0,
      location_id: 0,
      action: '',
      is_flag: null,
      reference_id: '',
      category: '',
      subcategory_id: 0,
      product_id: 0,
      date_from: '',
      date_to: '',
      days: 0,
    };
    setSearchQuery('');
    setLocalFilters(clearedFilters);
    dispatch(resetFilters());
    dispatch(fetchAuditLogs({}));
  }, [dispatch]);

  // Removed obsolete searchTimeout cleanup; debounce hook manages timing

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

  const handleFlagToggle = async (logId: number, currentFlagStatus: boolean) => {
    try {
      await dispatch(flagAuditLog({ id: logId, is_flag: !currentFlagStatus })).unwrap();
      Toast.show({
        type: 'success',
        text1: !currentFlagStatus ? 'Log Flagged' : 'Log Unflagged',
        text2: !currentFlagStatus ? 'Audit log has been flagged for attention' : 'Flag has been removed from audit log',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update flag status',
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
    if (!values || typeof values !== 'object') return null;

    // Separate into non-ID fields and ID fields for clearer ordering
    const entries = Object.entries(values).filter(([key, value]) => {
      // Skip internal fields for cleaner display
      if (key === 'created_at' || key === 'updated_at') return false;
      // Skip noisy empty/zero fields
      if (value === '' || value === 0 || value === null || value === undefined) return false;
      return true;
    });

    const isIdKey = (k: string) => k === 'id' || k.endsWith('_id');

    const fieldEntries = entries.filter(([k]) => !isIdKey(k));
    const idEntries = entries.filter(([k]) => isIdKey(k));

    const renderRow = (key: string, value: any) => {
      const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      return (
        <View style={styles.valueRow} key={key}>
          <Text style={styles.valueKey}>{key}:</Text>
          <Text style={styles.valueText}>{formattedValue}</Text>
        </View>
      );
    };

    const rows: React.ReactNode[] = [];
    fieldEntries.forEach(([k, v]) => rows.push(renderRow(k, v)));
    if (idEntries.length > 0) {
      rows.push(
        <Text style={styles.valuesSubTitle} key="ids__title">IDs</Text>
      );
      idEntries.forEach(([k, v]) => rows.push(renderRow(k, v)));
    }
    return rows;
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
    const rawQty = item.new_data?.quantity;
    const quantity = rawQty !== undefined && rawQty !== null ? Number(rawQty) : undefined;
    // Normalize is_flag to strict boolean to avoid rendering numeric 0
    const isFlagged = Boolean(item.is_flag);

    return (
      <View style={[styles.logCard, isFlagged && styles.flaggedLogCard]}>
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

            {/**
             * Commented out inline Flagged chip to reduce header crowding
             * Keeping for potential future use.
             */}
            {/**
            {isFlagged && (
              <View style={styles.flagIndicator}>
                <Flag size={12} color="#dc2626" fill="#dc2626" />
                <Text style={styles.flagIndicatorText}>Flagged</Text>
              </View>
            )}
            */}
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
            {typeof quantity === 'number' && quantity > 0 && (
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
          <>
            <View style={{ marginBottom: 8 }}>
              <TouchableOpacity onPress={() => toggleExpanded(item.id)} style={styles.toggleDetailsButton}>
                <Text style={styles.toggleDetailsText}>{expandedIds[item.id] ? 'Hide details' : 'Show details'}</Text>
                <ChevronUp
                  size={14}
                  color={expandedIds[item.id] ? '#2563eb' : '#6b7280'}
                  style={{ transform: [{ rotate: expandedIds[item.id] ? '0deg' : '180deg' }] }}
                />
              </TouchableOpacity>
            </View>
            {expandedIds[item.id] && (
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
          </>
        )}

        <View style={styles.actionButtons}>
          {isMaster && (
            <TouchableOpacity
              style={[styles.flagButton, isFlagged && styles.flaggedButton]}
              onPress={() => handleFlagToggle(item.id, isFlagged)}
              disabled={loading}
            >
              <Flag size={16} color={isFlagged ? "#dc2626" : "#d97706"} fill={isFlagged ? "#dc2626" : "none"} />
              <Text style={[styles.flagButtonText, isFlagged && styles.flaggedButtonText]}>
                {isFlagged ? 'Unflag' : 'Flag'}
              </Text>
            </TouchableOpacity>
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
      </View>
    );
  };

  // Keep UI mounted during loading to prevent TextInput focus loss

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Audit Logs</Text>
        <View style={styles.headerActions}>
          {isMaster && (
            <>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  showMyLogsOnly && styles.toggleButtonActive,
                ]}
                onPress={() => setShowMyLogsOnly(!showMyLogsOnly)}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    showMyLogsOnly && styles.toggleButtonTextActive,
                  ]}
                >
                  My Logs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  showFlaggedOnly && styles.toggleButtonActive,
                ]}
                onPress={() => setShowFlaggedOnly(!showFlaggedOnly)}
              >
                <Flag size={16} color={showFlaggedOnly ? '#ffffff' : '#6b7280'} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    showFlaggedOnly && styles.toggleButtonTextActive,
                  ]}
                >
                  Flagged
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Non-blocking loading overlay to keep inputs mounted */}
      {loading && !refreshing && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <LoadingSpinner />
        </View>
      )}

    {/* Search and Filter Section */}
    <View style={styles.searchContainer}>
      <CustomSearchBar
        placeholder="Search audit logs... (for reference id use REF=12345) "
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => setSearchQuery('')}
      />
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFiltersModal(true)}
      >
        <Filter size={20} color="#2563eb" />
        {getActiveFiltersCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>

    {/* Active Filters Display */}
    {getActiveFiltersCount() > 0 && (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
        <View style={styles.activeFiltersRow}>
          {localFilters.search && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Search: {localFilters.search}</Text>
            </View>
          )}
          {localFilters.user_id > 0 && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                User: {users.find(u => u.id === localFilters.user_id)?.username || 'Unknown'}
              </Text>
            </View>
          )}
          {localFilters.location_id > 0 && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Location: {locations.find((l: any) => l.id === localFilters.location_id)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          {localFilters.action && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Action: {localFilters.action}</Text>
            </View>
          )}
          {localFilters.is_flag === true && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Flagged Only</Text>
            </View>
          )}
          {localFilters.category && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Category: {localFilters.category}</Text>
            </View>
          )}
          {localFilters.days > 0 && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Last {localFilters.days} days</Text>
            </View>
          )}
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

    <FlatList
      ref={flatListRef}
      data={filteredLogs}
      renderItem={renderAuditLog}
      keyExtractor={(item) => item.id.toString()}
      extraData={expandedIds}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
      getItemLayout={undefined}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
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

    {/* Filters Modal */}
    <AuditLogFiltersModal
      isVisible={showFiltersModal}
      onClose={() => setShowFiltersModal(false)}
      filters={localFilters}
      onApplyFilters={handleApplyFilters}
      subcategories={subcategories}
      locations={locations}
      users={users}
      products={products}
    />

    {/* Scroll to Top Button */}
    {showScrollToTop && (
      <TouchableOpacity 
        style={styles.scrollToTopButton}
        onPress={scrollToTop}
        activeOpacity={0.8}
      >
        <ChevronUp size={24} color="white" />
      </TouchableOpacity>
    )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  toggleButton: {
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
  toggleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  filterButtons: {
    flexDirection: 'column',
    gap: 6,
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
  flaggedLogCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    backgroundColor: '#fefefe',
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
    gap: 4,
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
  flagIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  flagIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
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
  valuesSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
  },
  valuesList: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleDetailsText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
    marginRight: 2,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7', // Yellow background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24', // Yellow border
  },
  flaggedButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  flagButtonText: {
    color: '#d97706', // Orange/amber text
    fontWeight: '600',
    fontSize: 14,
  },
  flaggedButtonText: {
    color: '#dc2626',
  },
  revertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
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
  // Search and Filter Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    fontSize: 12,
    height: 36,
  },
  filterButton: {
    width: 40,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activeFiltersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  filterChipText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearAllButtonText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});