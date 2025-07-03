import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, TrendingUp, TrendingDown, Package, Users, Activity, DollarSign, TriangleAlert as AlertTriangle, Calendar, Target, Zap } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchInventoryEntries } from '../../store/slices/inventorySlice';
import { fetchAlerts } from '../../store/slices/alertsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const cardWidth = isTablet ? (width - 60) / 3 : (width - 52) / 2;

export default function Statistics() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.products.list);
  const inventoryEntries = useAppSelector(state => state.inventory.entries);
  const alerts = useAppSelector(state => state.alerts);
  const users = useAppSelector(state => state.users.list);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchProducts()),
        dispatch(fetchInventoryEntries()),
        dispatch(fetchAlerts()),
        dispatch(fetchUsers()),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    onRefresh();
  }, []);

  // Calculate statistics
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => (p.current_stock || 0) > 0).length;
  const outOfStockProducts = products.filter(p => (p.current_stock || 0) === 0).length;
  const lowStockProducts = products.filter(p => 
    p.current_stock !== undefined && 
    p.min_stock_threshold !== undefined &&
    p.current_stock < p.min_stock_threshold
  ).length;

  const totalValue = products.reduce((sum, product) => {
    return sum + (product.current_stock || 0) * product.cost;
  }, 0);

  const totalUsers = users.length;
  const masterUsers = users.filter(u => u.role === 'master').length;
  const employeeUsers = users.filter(u => u.role === 'employee').length;

  const totalEntries = inventoryEntries.length;
  const todayEntries = inventoryEntries.filter(entry => {
    const today = new Date().toDateString();
    const entryDate = new Date(entry.created_at).toDateString();
    return today === entryDate;
  });

  const thisWeekEntries = inventoryEntries.filter(entry => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(entry.created_at) >= weekAgo;
  });

  const inEntries = inventoryEntries.filter(e => e.entry_type.includes('in')).length;
  const outEntries = inventoryEntries.filter(e => e.entry_type.includes('out')).length;

  // Category breakdown
  const categoryStats = {
    raw: products.filter(p => p.category === 'raw').length,
    semi: products.filter(p => p.category === 'semi').length,
    finished: products.filter(p => p.category === 'finished').length,
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = '#2563eb', 
    subtitle,
    trend,
    size = 'normal'
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color?: string; 
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    size?: 'normal' | 'large';
  }) => (
    <View style={[
      styles.statCard,
      size === 'large' && styles.largeCard,
      { width: size === 'large' ? cardWidth : cardWidth }
    ]}>
      <View style={styles.statHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend && (
          <View style={[
            styles.trendBadge, 
            { backgroundColor: trend === 'up' ? '#dcfce7' : trend === 'down' ? '#fef2f2' : '#f3f4f6' }
          ]}>
            <Text style={[
              styles.trendText, 
              { color: trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#6b7280' }
            ]}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, size === 'large' && styles.largeStatValue]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[styles.statTitle, size === 'large' && styles.largeStatTitle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.statSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (!products.length && !refreshing) {
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
          <BarChart3 size={24} color="#2563eb" />
          <View>
            <Text style={styles.title}>Statistics & Analytics</Text>
            <Text style={styles.subtitle}>Comprehensive system overview</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Inventory Value"
                value={`$${totalValue.toLocaleString()}`}
                subtitle="Current stock value"
                icon={<DollarSign size={24} color="#10b981" />}
                color="#10b981"
                trend="up"
                size="large"
              />
              <StatCard
                title="Total Products"
                value={totalProducts}
                subtitle={`${inStockProducts} in stock`}
                icon={<Package size={24} color="#2563eb" />}
                trend="up"
                size="large"
              />
            </View>
          </View>
        </View>

        {/* Product Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="In Stock"
                value={inStockProducts}
                subtitle="Products available"
                icon={<Package size={20} color="#10b981" />}
                color="#10b981"
                trend="up"
              />
              <StatCard
                title="Out of Stock"
                value={outOfStockProducts}
                subtitle="Need restocking"
                icon={<AlertTriangle size={20} color="#f59e0b" />}
                color="#f59e0b"
                trend={outOfStockProducts > 0 ? "down" : "neutral"}
              />
              <StatCard
                title="Low Stock"
                value={lowStockProducts}
                subtitle="Below threshold"
                icon={<TrendingDown size={20} color="#ef4444" />}
                color="#ef4444"
                trend={lowStockProducts > 0 ? "down" : "up"}
              />
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Categories</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Raw Materials"
                value={categoryStats.raw}
                subtitle="Base materials"
                icon={<Target size={20} color="#6b7280" />}
                color="#6b7280"
                trend="neutral"
              />
              <StatCard
                title="Semi-Finished"
                value={categoryStats.semi}
                subtitle="In production"
                icon={<Activity size={20} color="#3b82f6" />}
                color="#3b82f6"
                trend="neutral"
              />
              <StatCard
                title="Finished Products"
                value={categoryStats.finished}
                subtitle="Ready to ship"
                icon={<Zap size={20} color="#10b981" />}
                color="#10b981"
                trend="up"
              />
            </View>
          </View>
        </View>

        {/* Activity Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Today's Entries"
                value={todayEntries.length}
                subtitle="Activities today"
                icon={<Calendar size={20} color="#2563eb" />}
                color="#2563eb"
                trend="up"
              />
              <StatCard
                title="This Week"
                value={thisWeekEntries.length}
                subtitle="Last 7 days"
                icon={<Activity size={20} color="#10b981" />}
                color="#10b981"
                trend="up"
              />
              <StatCard
                title="Total Entries"
                value={totalEntries}
                subtitle="All time"
                icon={<BarChart3 size={20} color="#f59e0b" />}
                color="#f59e0b"
                trend="up"
              />
            </View>
          </View>
        </View>

        {/* Entry Type Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Types</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Stock In"
                value={inEntries}
                subtitle="Items received"
                icon={<TrendingUp size={20} color="#10b981" />}
                color="#10b981"
                trend="up"
              />
              <StatCard
                title="Stock Out"
                value={outEntries}
                subtitle="Items dispatched"
                icon={<TrendingDown size={20} color="#ef4444" />}
                color="#ef4444"
                trend="down"
              />
              <StatCard
                title="Net Movement"
                value={inEntries - outEntries}
                subtitle="Overall change"
                icon={<Activity size={20} color="#2563eb" />}
                color="#2563eb"
                trend={inEntries > outEntries ? "up" : "down"}
              />
            </View>
          </View>
        </View>

        {/* User Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Users"
                value={totalUsers}
                subtitle="System users"
                icon={<Users size={20} color="#2563eb" />}
                color="#2563eb"
                trend="up"
              />
              <StatCard
                title="Master Users"
                value={masterUsers}
                subtitle="Admin access"
                icon={<Users size={20} color="#f59e0b" />}
                color="#f59e0b"
                trend="neutral"
              />
              <StatCard
                title="Employees"
                value={employeeUsers}
                subtitle="Standard access"
                icon={<Users size={20} color="#10b981" />}
                color="#10b981"
                trend="up"
              />
            </View>
          </View>
        </View>

        {/* Alerts Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Summary</Text>
          <View style={styles.alertSummaryCard}>
            <View style={styles.alertSummaryHeader}>
              <AlertTriangle size={24} color="#ef4444" />
              <View style={styles.alertSummaryContent}>
                <Text style={styles.alertSummaryTitle}>Active Alerts</Text>
                <Text style={styles.alertSummarySubtitle}>
                  {alerts.unresolvedCount} unresolved alert{alerts.unresolvedCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.alertSummaryValue}>{alerts.unresolvedCount}</Text>
            </View>
            <View style={styles.alertSummaryDetails}>
              <Text style={styles.alertSummaryDetailText}>
                {lowStockProducts} product{lowStockProducts !== 1 ? 's' : ''} below minimum threshold
              </Text>
              <Text style={styles.alertSummaryDetailText}>
                {outOfStockProducts} product{outOfStockProducts !== 1 ? 's' : ''} out of stock
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  largeCard: {
    padding: 20,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  largeStatValue: {
    fontSize: 28,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  largeStatTitle: {
    fontSize: 16,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  alertSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertSummaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  alertSummarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  alertSummaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ef4444',
  },
  alertSummaryDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  alertSummaryDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
});