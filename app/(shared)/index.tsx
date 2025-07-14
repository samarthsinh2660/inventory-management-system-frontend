import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, TrendingUp, TriangleAlert as AlertTriangle, Activity, ChartBar as BarChart3, Bell, Target, Zap, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { IfMaster } from '../../components/IfMaster';
import { fetchProducts } from '../../store/slices/productsSlice';
import { fetchInventoryEntries, fetchUserEntries, fetchInventoryBalance } from '../../store/slices/inventorySlice';
import { fetchAlerts, fetchNotifications } from '../../store/slices/alertsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { 
  getTodayEntries, 
  getLowStockProducts, 
  calculateTotalInventoryValue, 
  getInStockProductsCount, 
  getEntryCountsByType 
} from '../../utils/helperFunctions';
import { UserRole, User } from '@/types/user';
import { Notification } from '@/types/alerts';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const cardWidth = isTablet ? (width - 60) / 3 : (width - 52) / 2;

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const products = useAppSelector(state => state.products.list);
  const users = useAppSelector(state => state.users.list || []);
  const { entries: inventoryEntries, userEntries, balance: inventoryBalance } = useAppSelector(state => state.inventory);
  const { alerts, notifications } = useAppSelector(state => state.alerts);
  const [refreshing, setRefreshing] = React.useState(false);

  const isMaster = user?.role === UserRole.MASTER;

  // Calculate unresolved alerts count from notifications
  const unresolvedAlertsCount = notifications.filter((notification: Notification) => !notification.is_read).length;
  const todayEntries = getTodayEntries(inventoryEntries, userEntries, users, isMaster);
  const myEntries = isMaster ? inventoryEntries : userEntries;
  const myTodayEntries = todayEntries;
  
  const lowStockProducts = getLowStockProducts(inventoryBalance, products);
  const totalValue = calculateTotalInventoryValue(inventoryBalance, products);
  const inStockProducts = getInStockProductsCount(inventoryBalance);
  const { totalInEntries, totalOutEntries } = getEntryCountsByType(myTodayEntries);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch all data with proper parameters for dashboard - higher limit to get more complete data
      const dashboardParams = { page: 1, limit: 100 };
      
      await Promise.all([
        dispatch(fetchProducts(dashboardParams)),
        dispatch(fetchInventoryEntries(dashboardParams)),
        dispatch(fetchInventoryBalance()),
        !isMaster && dispatch(fetchUserEntries(dashboardParams)),
        isMaster && dispatch(fetchAlerts(dashboardParams)),
        isMaster && dispatch(fetchNotifications()),
        isMaster && dispatch(fetchUsers()),
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
    </TouchableOpacity>
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
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>
              {isMaster ? 'Master Dashboard' : 'Employee Dashboard'}
            </Text>
            <Text style={styles.welcomeText} numberOfLines={1}>
              Welcome back, {user?.username}!
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <IfMaster>
            {unresolvedAlertsCount > 0 && (
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => router.push('/(alerts)/alerts')}
              >
                <Bell size={20} color="#ef4444" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unresolvedAlertsCount}</Text>
                </View>
              </TouchableOpacity>
            )}
          </IfMaster>
        </View>

        {/* Master Dashboard */}
        <IfMaster>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Products"
                value={products.length}
                subtitle={`${inStockProducts} in stock`}
                icon={<Package size={24} color="#2563eb" />}
                onPress={() => router.push('/products')}
                trend="up"
                size="large"
              />
              <StatCard
                title="Inventory Value"
                value={`$${totalValue.toLocaleString()}`}
                subtitle="Total stock value"
                icon={<BarChart3 size={24} color="#10b981" />}
                color="#10b981"
                trend="up"
                size="large"
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Today's Activity"
                value={todayEntries.length}
                subtitle={`${totalInEntries} in, ${totalOutEntries} out`}
                icon={<Activity size={20} color="#f59e0b" />}
                color="#f59e0b"
                onPress={() => router.push('/inventory')}
                trend="neutral"
              />
              <StatCard
                title="Low Stock Alerts"
                value={unresolvedAlertsCount}
                subtitle={lowStockProducts.length > 0 ? "Needs attention" : "All good"}
                icon={<AlertTriangle size={20} color="#ef4444" />}
                color="#ef4444"
                onPress={() => router.push('/alerts')}
                trend={unresolvedAlertsCount > 0 ? "down" : "up"}
              />
              <StatCard
                title="Total Users"
                value={users.length}
                subtitle={`${users.filter((u: User) => u.role === UserRole.MASTER).length} masters`}
                icon={<Users size={20} color="#8b5cf6" />}
                color="#8b5cf6"
                onPress={() => router.push('/(auth)/user-management')}
                trend="neutral"
              />
            </View>
          </View>
        </IfMaster>

        {/* Employee Dashboard */}
        {!isMaster && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="My Today's Entries"
                value={myTodayEntries.length}
                subtitle={`${myTodayEntries.filter(e => e.entry_type.includes('in')).length} in, ${myTodayEntries.filter(e => e.entry_type.includes('out')).length} out`}
                icon={<Activity size={24} color="#2563eb" />}
                color="#2563eb"
                onPress={() => router.push('/inventory')}
                trend="up"
                size="large"
              />
              <StatCard
                title="Total Products"
                value={products.length}
                subtitle={`${inStockProducts} available`}
                icon={<Package size={24} color="#10b981" />}
                color="#10b981"
                onPress={() => router.push('/products')}
                trend="neutral"
                size="large"
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="My Total Entries"
                value={myEntries.length}
                subtitle="All time entries"
                icon={<Target size={20} color="#f59e0b" />}
                color="#f59e0b"
                onPress={() => router.push('/inventory')}
                trend="up"
              />
              <StatCard
                title="Quick Entry"
                value="Ready"
                subtitle="Add inventory entry"
                icon={<Zap size={20} color="#8b5cf6" />}
                color="#8b5cf6"
                onPress={() => router.push('/inventory')}
                trend="neutral"
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/inventory')}
            >
              <Activity size={24} color="#2563eb" />
              <Text style={styles.quickActionText}>Add Entry</Text>
            </TouchableOpacity>
            <IfMaster>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/create-product')}
              >
                <TrendingUp size={24} color="#f59e0b" />
                <Text style={styles.quickActionText}>Add Product</Text>
              </TouchableOpacity>
            </IfMaster>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  clickableCard: {
    transform: [{ scale: 1 }],
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

  section: {
    margin: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },

  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
});