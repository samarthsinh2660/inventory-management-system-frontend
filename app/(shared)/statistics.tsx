import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Package, 
  TrendingUp, 
  TriangleAlert as AlertTriangle, 
  Activity, 
  ChartBar as BarChart3, 
  Bell, 
  ArrowRight, 
  Clock, 
  Target, 
  Zap, 
  Users,
  MapPin,
  Calculator,
  FileText,
  DollarSign,
  Boxes,
  TrendingDown
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchInventoryEntries, fetchUserEntries, fetchInventoryBalance } from '../../store/slices/inventorySlice';
import { fetchAlerts, fetchNotifications } from '../../store/slices/alertsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { fetchAuditLogs } from '../../store/slices/auditLogsSlice';
import { fetchLocations } from '../../store/slices/locationsSlice';
import { fetchSubcategories } from '../../store/slices/subcategoriesSlice';
import { fetchFormulas } from '../../store/slices/formulasSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { 
  getUsernameById, 
  getTodayEntries, 
  getLowStockProducts, 
  calculateTotalInventoryValue, 
  getInStockProductsCount, 
  getEntryCountsByType 
} from '../../utils/helperFunctions';
import { UserRole } from '@/types/user';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const cardWidth = isTablet ? (width - 60) / 3 : (width - 52) / 2;

export default function Statistics() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux selectors - following index.tsx patterns
  const user = useAppSelector(state => state.auth.user);
  const products = useAppSelector(state => state.products.list);
  const users = useAppSelector(state => state.users.list || []);
  const { entries: inventoryEntries, userEntries, balance: inventoryBalance } = useAppSelector(state => state.inventory);
  const { alerts, notifications } = useAppSelector(state => state.alerts);
  const auditLogs = useAppSelector(state => state.auditLogs.list);
  const locations = useAppSelector(state => state.locations.list);
  const subcategories = useAppSelector(state => state.subcategories.list);
  const formulas = useAppSelector(state => state.formulas.list);
  
  const [refreshing, setRefreshing] = React.useState(false);

  const isMaster = user?.role === UserRole.MASTER;

  // Helper function calculations using inventory balance
  const unresolvedAlertsCount = notifications.filter(notification => !notification.is_read).length;
  const todayEntries = getTodayEntries(inventoryEntries, userEntries, users, isMaster);
  const myEntries = isMaster ? inventoryEntries : userEntries;
  const myTodayEntries = todayEntries;
  
  const lowStockProducts = getLowStockProducts(inventoryBalance, products);
  const totalValue = calculateTotalInventoryValue(inventoryBalance, products);
  const inStockProducts = getInStockProductsCount(inventoryBalance);
  const { totalInEntries, totalOutEntries } = getEntryCountsByType(myTodayEntries);

  // Additional statistics calculations
  const totalProducts = products.length;
  const outOfStockProducts = inventoryBalance.filter(item => item.total_quantity === 0).length;
  const averageStockPerProduct = totalProducts > 0 ? 
    inventoryBalance.reduce((sum, item) => sum + item.total_quantity, 0) / totalProducts : 0;

  // User and system statistics (master only)
  const masterUsers = isMaster ? users.filter(u => u.role === UserRole.MASTER).length : 0;
  const employeeUsers = isMaster ? users.filter(u => u.role === UserRole.EMPLOYEE).length : 0;
  const totalLocations = locations.length;
  const totalFormulas = formulas.length;
  const totalAuditLogs = isMaster ? auditLogs.length : 0;

  // Manufacturing vs Manual entries analysis - fixed entry_type comparison
  const manufacturingEntries = myTodayEntries.filter(entry => 
    entry.entry_type === 'manufacturing_in' || entry.entry_type === 'manufacturing_out'
  ).length;
  const manualEntries = myTodayEntries.filter(entry => 
    entry.entry_type === 'manual_in' || entry.entry_type === 'manual_out'
  ).length;

  // Weekly and monthly trends (simplified - using last 7 and 30 entries as approximation)
  const recentEntries = myEntries.slice(-30);
  const weeklyEntries = myEntries.slice(-7);
  const monthlyTrend = recentEntries.length > 15 ? 'up' : recentEntries.length < 5 ? 'down' : 'neutral';
  const weeklyTrend = weeklyEntries.length > 3 ? 'up' : weeklyEntries.length < 2 ? 'down' : 'neutral';

  // Category analysis (master only for detailed view)
  const categoryStats = isMaster ? subcategories.map(category => {
    const categoryProducts = products.filter(p => p.subcategory_id === category.id);
    const categoryBalance = inventoryBalance.filter(item => 
      categoryProducts.some(p => p.id === item.product_id)
    );
    const totalQuantity = categoryBalance.reduce((sum, item) => sum + item.total_quantity, 0);
    const totalValue = categoryBalance.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (item.total_quantity * (Number(product?.price || 0)));
    }, 0);

    return {
      name: category.name,
      productCount: categoryProducts.length,
      totalQuantity,
      totalValue
    };
  }).filter(stat => stat.productCount > 0) : [];

  // Location distribution (master only)
  const locationStats = isMaster ? locations.map(location => {
    const locationBalance = inventoryBalance.filter(item => item.location_id === location.id);
    const totalQuantity = locationBalance.reduce((sum, item) => sum + item.total_quantity, 0);
    return {
      name: location.name,
      totalQuantity,
      productCount: locationBalance.length
    };
  }).filter(stat => stat.totalQuantity > 0) : [];

  // Turnover rate calculation (simplified)
  const totalInventoryQuantity = inventoryBalance.reduce((sum, item) => sum + item.total_quantity, 0);
  const dailyOutflow = totalOutEntries;
  const turnoverRate = totalInventoryQuantity > 0 && dailyOutflow > 0 ? 
    (dailyOutflow / totalInventoryQuantity * 100).toFixed(1) : '0.0';

  // Critical alerts (unresolved alerts) - master only
  const criticalAlerts = isMaster ? alerts.filter(alert => !alert.is_resolved).length : 0;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch all data with proper parameters for dashboard - following index.tsx pattern
      const dashboardParams = { page: 1, limit: 100 };
      
      await Promise.all([
        dispatch(fetchProducts(dashboardParams)),
        dispatch(fetchInventoryEntries(dashboardParams)),
        dispatch(fetchInventoryBalance()),
        !isMaster && dispatch(fetchUserEntries(dashboardParams)),
        isMaster && dispatch(fetchAlerts(dashboardParams)),
        isMaster && dispatch(fetchNotifications()),
        isMaster && dispatch(fetchUsers()),
        isMaster && dispatch(fetchAuditLogs(dashboardParams)),
        dispatch(fetchLocations()),
        dispatch(fetchSubcategories()),
        dispatch(fetchFormulas()),
      ].filter(Boolean));
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, isMaster]);

  useEffect(() => {
    onRefresh();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = '#2563eb', 
    onPress,
    subtitle,
    trend,
    size = 'normal'
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color?: string; 
    onPress?: () => void; 
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    size?: 'normal' | 'large';
  }) => (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        onPress && styles.clickableCard,
        size === 'large' && styles.largeCard,
        { width: size === 'large' ? cardWidth : cardWidth }
      ]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend && (
          <View style={[
            styles.trendIndicator,
            { backgroundColor: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280' }
          ]}>
            <Text style={[
              styles.trendText,
              { color: 'white' }
            ]}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={[
          styles.statValue,
          size === 'large' && styles.largeStatValue
        ]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={[
          styles.statTitle,
          size === 'large' && styles.largeStatTitle
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (refreshing && inventoryBalance.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistics Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive analytics and insights
          </Text>
        </View>

        {/* Critical Alerts Banner - Master Only */}
        {isMaster && (unresolvedAlertsCount > 0 || criticalAlerts > 0) && (
          <TouchableOpacity 
            style={styles.alertsCard}
            onPress={() => router.push('/alerts')}
          >
            <View style={styles.alertsHeader}>
              <View style={styles.alertsIcon}>
                <AlertTriangle size={24} color="#ef4444" />
              </View>
              <View style={styles.alertsContent}>
                <Text style={styles.alertsTitle}>
                  {unresolvedAlertsCount } Active Alerts
                </Text>
                <Text style={styles.alertsSubtitle}>
                  {unresolvedAlertsCount} unread notifications
                </Text>
              </View>
              <ArrowRight size={20} color="#ef4444" />
            </View>
          </TouchableOpacity>
        )}

        {/* Inventory Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Overview</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Products"
              value={totalProducts}
              icon={<Package size={28} color="#2563eb" />}
              color="#2563eb"
              size="large"
            />
            <StatCard
              title="Inventory Value"
              value={`$${totalValue.toLocaleString()}`}
              icon={<DollarSign />}
              color="#059669"
              size="large"
            />
            <StatCard
              title="In Stock"
              value={inStockProducts}
              icon={<Boxes />}
              color="#059669"
              subtitle={`${totalProducts - outOfStockProducts} available`}
            />
            <StatCard
              title="Out of Stock"
              value={outOfStockProducts}
              icon={<TrendingDown />}
              color="#ef4444"
              subtitle="Need restocking"
            />
            <StatCard
              title="Low Stock Items"
              value={lowStockProducts.length}
              icon={<AlertTriangle />}
              color="#f59e0b"
              onPress={isMaster ? () => router.push('/alerts') : undefined}
            />
            <StatCard
              title="Avg Stock/Product"
              value={averageStockPerProduct.toFixed(1)}
              icon={<BarChart3 />}
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* Inventory Movements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Movements</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Today's Entries"
              value={myTodayEntries.length}
              icon={<Activity />}
              color="#2563eb"
              trend={myTodayEntries.length > 5 ? 'up' : myTodayEntries.length < 2 ? 'down' : 'neutral'}
            />
            <StatCard
              title="Weekly Trend"
              value={weeklyEntries.length}
              icon={<TrendingUp />}
              color="#059669"
              trend={weeklyTrend}
              subtitle="Last 7 entries"
            />
            <StatCard
              title="Stock In (Today)"
              value={totalInEntries}
              icon={<ArrowRight />}
              color="#059669"
              subtitle="Incoming stock"
            />
            <StatCard
              title="Stock Out (Today)"
              value={totalOutEntries}
              icon={<ArrowRight />}
              color="#ef4444"
              subtitle="Outgoing stock"
            />
            <StatCard
              title="Manufacturing"
              value={manufacturingEntries}
              icon={<Zap />}
              color="#8b5cf6"
              subtitle={`vs Manual: ${manualEntries}`}
            />
            <StatCard
              title="Turnover Rate"
              value={`${turnoverRate}%`}
              icon={<Target />}
              color="#f59e0b"
              subtitle="Daily rate"
            />
          </View>
        </View>

        {/* Category Analysis Section - Master Only */}
        {isMaster && categoryStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Analysis</Text>
            </View>
            <View style={styles.statsGrid}>
              {categoryStats.slice(0, 6).map((category, index) => (
                <StatCard
                  key={category.name}
                  title={category.name}
                  value={category.totalQuantity}
                  icon={<Package />}
                  color={['#2563eb', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]}
                  subtitle={`${category.productCount} products, $${category.totalValue.toLocaleString()}`}
                />
              ))}
            </View>
          </View>
        )}

        {isMaster && (
          <>
            {/* User & System Activity Section - Master Only */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>User & System Activity</Text>
              </View>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Master Users"
                  value={masterUsers}
                  icon={<Users />}
                  color="#2563eb"
                  onPress={() => router.push('/user-management')}
                />
                <StatCard
                  title="Employee Users"
                  value={employeeUsers}
                  icon={<Users />}
                  color="#059669"
                  onPress={() => router.push('/user-management')}
                />
                <StatCard
                  title="Total Locations"
                  value={totalLocations}
                  icon={<MapPin />}
                  color="#f59e0b"
                  onPress={() => router.push('/products')}
                />
                <StatCard
                  title="Formulas"
                  value={totalFormulas}
                  icon={<Calculator />}
                  color="#8b5cf6"
                  onPress={() => router.push('/products')}
                />
                <StatCard
                  title="Audit Logs"
                  value={totalAuditLogs}
                  icon={<FileText />}
                  color="#6b7280"
                  onPress={() => router.push('/audit')}
                />
                <StatCard
                  title="System Health"
                  value="Good"
                  icon={<Activity />}
                  color="#059669"
                  subtitle="All systems operational"
                />
              </View>
            </View>

            {/* Location Distribution Section - Master Only */}
            {locationStats.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Location Distribution</Text>
                </View>
                <View style={styles.statsGrid}>
                  {locationStats.slice(0, 6).map((location, index) => (
                    <StatCard
                      key={location.name}
                      title={location.name}
                      value={location.totalQuantity}
                      icon={<MapPin />}
                      color={['#2563eb', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]}
                      subtitle={`${location.productCount} product types`}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Alert Summary Section - Master Only */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Alert Summary</Text>
              </View>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Unresolved Alerts"
                  value={criticalAlerts}
                  icon={<AlertTriangle />}
                  color="#ef4444"
                  onPress={() => router.push('/alerts')}
                />
                <StatCard
                  title="Notifications"
                  value={unresolvedAlertsCount}
                  icon={<Bell />}
                  color="#f59e0b"
                  subtitle="Unread notifications"
                  onPress={() => router.push('/alerts')}
                />
                <StatCard
                  title="Critical Items"
                  value={lowStockProducts.length}
                  icon={<Target />}
                  color="#ef4444"
                  subtitle="Below minimum threshold"
                />
                <StatCard
                  title="Alert Response"
                  value="Active"
                  icon={<Activity />}
                  color="#059669"
                  subtitle="Monitoring enabled"
                />
              </View>
            </View>
          </>
        )}

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    margin: 20,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  clickableCard: {
    cursor: 'pointer',
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendIndicator: {
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
  alertsCard: {
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
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertsContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  alertsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});