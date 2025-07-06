import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { TextInput, Chip } from 'react-native-paper';
import { X, Search, Filter, Package, DollarSign, TrendingUp, TrendingDown, AlertTriangle, ArrowUpDown } from 'lucide-react-native';
import { useAppSelector } from '../../hooks/useAppSelector';

interface AllBalancesModalProps {
  visible: boolean;
  onClose: () => void;
}

type SortField = 'name' | 'quantity' | 'value' | 'price' | 'location';
type SortOrder = 'asc' | 'desc';
type StockFilter = 'all' | 'low' | 'out' | 'normal';

export default function AllBalancesModal({ visible, onClose }: AllBalancesModalProps) {
  const products = useAppSelector(state => state.products.list || []);
  const balance = useAppSelector(state => state.inventory.balance || []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Get unique locations from balance data
  const locations = useMemo(() => {
    const locationSet = new Set(balance.map(item => item.location_name).filter(Boolean));
    return Array.from(locationSet).sort();
  }, [balance]);

  // Enhanced balance data with product information
  const enhancedBalance = useMemo(() => {
    return balance.map(item => {
      const product = products.find(p => p.id === item.product_id);
      const minThreshold = product?.min_stock_threshold || 0;
      const isLowStock = item.total_quantity < minThreshold && item.total_quantity > 0;
      const isOutOfStock = item.total_quantity === 0;
      
      return {
        ...item,
        product_unit: product?.unit || 'units',
        min_stock_threshold: minThreshold,
        category: product?.category || 'Unknown',
        subcategory_name: product?.subcategory_name || 'Unknown',
        stock_status: isOutOfStock ? 'out' : isLowStock ? 'low' : 'normal',
        total_value: item.total_price || (item.total_quantity * (item.price_per_unit || 0))
      };
    });
  }, [balance, products]);

  // Filter and sort logic
  const filteredAndSortedBalance = useMemo(() => {
    let filtered = enhancedBalance.filter(item => {
      // Search filter
      const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Stock status filter
      if (stockFilter !== 'all' && item.stock_status !== stockFilter) return false;

      // Location filter
      if (selectedLocation && item.location_name !== selectedLocation) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.product_name.toLowerCase();
          bValue = b.product_name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.total_quantity;
          bValue = b.total_quantity;
          break;
        case 'value':
          aValue = a.total_value;
          bValue = b.total_value;
          break;
        case 'price':
          aValue = a.price_per_unit;
          bValue = b.price_per_unit;
          break;
        case 'location':
          aValue = a.location_name.toLowerCase();
          bValue = b.location_name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enhancedBalance, searchTerm, sortField, sortOrder, stockFilter, selectedLocation]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = filteredAndSortedBalance.length;
    const totalValue = filteredAndSortedBalance.reduce((sum, item) => sum + item.total_value, 0);
    const lowStock = filteredAndSortedBalance.filter(item => item.stock_status === 'low').length;
    const outOfStock = filteredAndSortedBalance.filter(item => item.stock_status === 'out').length;
    
    return { total, totalValue, lowStock, outOfStock };
  }, [filteredAndSortedBalance]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setSelectedLocation('');
    setSortField('name');
    setSortOrder('asc');
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return '#f59e0b';
      case 'out': return '#ef4444';
      default: return '#16a34a';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'low': return 'Low Stock';
      case 'out': return 'Out of Stock';
      default: return 'In Stock';
    }
  };

  const renderBalanceItem = ({ item }: { item: any }) => (
    <View style={styles.balanceItem}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.productName}>{item.product_name || 'Unknown Product'}</Text>
          <Text style={styles.itemCategory}>{item.category} • {item.subcategory_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStockStatusColor(item.stock_status)}15` }]}>
          <Text style={[styles.statusText, { color: getStockStatusColor(item.stock_status) }]}>
            {getStockStatusText(item.stock_status)}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Package size={16} color="#6b7280" />
            <Text style={styles.detailLabel}>Current Stock</Text>
            <Text style={[styles.detailValue, { color: getStockStatusColor(item.stock_status) }]}>
              {item.total_quantity || 0} {item.product_unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.detailLabel}>Min Threshold</Text>
            <Text style={styles.detailValue}>{item.min_stock_threshold || 0} {item.product_unit}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <DollarSign size={16} color="#059669" />
            <Text style={styles.detailLabel}>Price/Unit</Text>
            <Text style={styles.detailValue}>₹{(item.price_per_unit || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <TrendingUp size={16} color="#2563eb" />
            <Text style={styles.detailLabel}>Total Value</Text>
            <Text style={styles.detailValue}>₹{item.total_value.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <Text style={styles.locationText}>📍 {item.location_name || 'Unknown Location'}</Text>
      </View>
    </View>
  );

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <TouchableOpacity
      style={[styles.sortButton, sortField === field && styles.activeSortButton]}
      onPress={() => handleSort(field)}
    >
      <Text style={[styles.sortButtonText, sortField === field && styles.activeSortButtonText]}>
        {label}
      </Text>
      {sortField === field && (
        <ArrowUpDown size={14} color="#2563eb" style={{ 
          transform: [{ rotate: sortOrder === 'desc' ? '180deg' : '0deg' }] 
        }} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>All Product Balances</Text>
            <Text style={styles.headerSubtitle}>{summary.total} products</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total Products</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₹{summary.totalValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Value</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{summary.lowStock}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{summary.outOfStock}</Text>
            <Text style={styles.summaryLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.controlsContainer}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, locations, categories..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterChip, stockFilter === 'all' && styles.activeFilterChip]}
              onPress={() => setStockFilter('all')}
            >
              <Text style={[styles.filterChipText, stockFilter === 'all' && styles.activeFilterChipText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, stockFilter === 'normal' && styles.activeFilterChip]}
              onPress={() => setStockFilter('normal')}
            >
              <Text style={[styles.filterChipText, stockFilter === 'normal' && styles.activeFilterChipText]}>In Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, stockFilter === 'low' && styles.activeFilterChip]}
              onPress={() => setStockFilter('low')}
            >
              <Text style={[styles.filterChipText, stockFilter === 'low' && styles.activeFilterChipText]}>Low Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, stockFilter === 'out' && styles.activeFilterChip]}
              onPress={() => setStockFilter('out')}
            >
              <Text style={[styles.filterChipText, stockFilter === 'out' && styles.activeFilterChipText]}>Out of Stock</Text>
            </TouchableOpacity>
            
            {locations.map(location => (
              <TouchableOpacity
                key={location}
                style={[styles.filterChip, selectedLocation === location && styles.activeFilterChip]}
                onPress={() => setSelectedLocation(selectedLocation === location ? '' : location)}
              >
                <Text style={[styles.filterChipText, selectedLocation === location && styles.activeFilterChipText]}>
                  📍 {location}
                </Text>
              </TouchableOpacity>
            ))}
            
            {(searchTerm || stockFilter !== 'all' || selectedLocation) && (
              <TouchableOpacity style={styles.clearFiltersChip} onPress={clearFilters}>
                <X size={14} color="#ef4444" />
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Sort Controls */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
            <SortButton field="name" label="Name" />
            <SortButton field="quantity" label="Quantity" />
            <SortButton field="value" label="Value" />
            <SortButton field="price" label="Price" />
            <SortButton field="location" label="Location" />
          </ScrollView>
        </View>

        {/* Balance List */}
        <FlatList
          data={filteredAndSortedBalance}
          renderItem={renderBalanceItem}
          keyExtractor={(item) => `${item.product_id}-${item.location_id}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No products match your filters</Text>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterChipText: {
    color: 'white',
  },
  clearFiltersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 12,
  },
  sortButtons: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    gap: 4,
  },
  activeSortButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeSortButtonText: {
    color: '#2563eb',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  balanceItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 