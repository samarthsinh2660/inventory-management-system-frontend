import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, User, Users, LogOut, Shield, Bell, Info, ChevronRight, TriangleAlert as AlertTriangle, TestTube, FileText, MapPin, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { IfMaster } from '../../components/IfMaster';
import { logout, clearAuth } from '../../store/slices/authSlice';
import { EditProfileForm } from '../../components/modals/EditProfileForm';
import { LocationsList } from '../../components/product/LocationsList';
import { CreateLocationModal } from '../../components/modals/CreateLocationModal';
import { fetchLocations } from '../../store/slices/locationsSlice';
import Modal from 'react-native-modal';
import { UserRole } from '@/types/user';
import { Notification } from '@/types/alerts';
import { Location } from '@/types/product';
import CrashTestComponent from '@/components/CrashTestComponent';

export default function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const { alerts, notifications } = useAppSelector(state => state.alerts);
  const locations = useAppSelector(state => state.locations.list);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCrashTesting, setShowCrashTesting] = useState(false);
  const [showLocationManagement, setShowLocationManagement] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { width: screenWidth } = Dimensions.get('window');
  const isMobileWidth = screenWidth < 768; // Consider mobile if width < 768px
  const isMaster = user?.role === UserRole.MASTER;

  const unresolvedAlertsCount = notifications.filter((notification: Notification) => !notification.is_read).length;

  // Location management handlers
  const handleCreateLocation = () => {
    setEditingLocation(null);
    setShowCreateLocation(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowCreateLocation(true);
  };

  const handleLocationModalClose = () => {
    setShowCreateLocation(false);
    setEditingLocation(null);
    // Refresh locations after modal closes
    dispatch(fetchLocations());
  };

  React.useEffect(() => {
    // Load locations when component mounts
    dispatch(fetchLocations());
  }, [dispatch]);

  const formatMemberSinceDetailed = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      // You can customize the format:
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      // This will show: "July 2, 2025"
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('Starting logout process...');
      
      // Dispatch logout action
      const result = await dispatch(logout());
      
      if (logout.fulfilled.match(result)) {
        console.log('Logout successful, navigating to login');
        // Navigate to login screen
        router.replace('/login');
      } else if (logout.rejected.match(result)) {
        console.log('Logout rejected, but clearing auth anyway');
        // Even if logout fails, clear auth and navigate
        dispatch(clearAuth());
        router.replace('/login');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Fallback: Force clear auth state and navigate
      dispatch(clearAuth());
      
      Alert.alert(
        'Logout Notice',
        'You have been logged out. If you experience any issues, please restart the app.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/login')
          }
        ]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  // If showing location management, render that view
  if (showLocationManagement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.locationHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowLocationManagement(false)}
            >
              <ArrowLeft size={20} color="#2563eb" />
            </TouchableOpacity>
            <View style={styles.locationHeaderContent}>
              <MapPin size={24} color="#2563eb" />
              <Text style={styles.title}>Location</Text>
            </View>
          </View>
        </View>

        <LocationsList
          locations={locations}
          onCreateLocation={handleCreateLocation}
          onEditLocation={handleEditLocation}
        />

        <CreateLocationModal
          isVisible={showCreateLocation}
          onClose={handleLocationModalClose}
          editingLocation={editingLocation || undefined}
        />
      </SafeAreaView>
    );
  }

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    danger = false,
    badge,
    disabled = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    danger?: boolean;
    badge?: number;
    disabled?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingsItem, disabled && styles.disabledItem]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.settingsIcon, danger && styles.dangerIcon]}>
        {icon}
      </View>
      <View style={styles.settingsContent}>
        <View style={styles.settingsTextContainer}>
          <Text style={[
            styles.settingsTitle, 
            danger && styles.dangerText,
            disabled && styles.disabledText
          ]}>
            {title}
          </Text>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[
            styles.settingsSubtitle,
            disabled && styles.disabledText
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <ChevronRight size={20} color={danger ? '#ef4444' : '#9ca3af'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <SettingsIcon size={25} color="#2563eb" />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              {isMaster ? (
                <Shield size={24} color="#f59e0b" />
              ) : (
                <User size={24} color="#6b7280" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username}</Text>
              <Text style={styles.profileRole}>
                {isMaster ? 'Master User' : 'Employee'}
              </Text>
              {user?.name && (
                <Text style={styles.profileSubtitle}>{user.name}</Text>
              )}
              {user?.email && (
                <Text style={styles.profileSubtitle}>{user.email}</Text>
              )}
              <Text style={styles.profileDate}>
                Member since {formatMemberSinceDetailed(user?.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<User size={20} color="#6b7280" />}
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => setShowEditProfileModal(true)}
            />
            <SettingsItem
              icon={<Bell size={20} color="#6b7280" />}
              title="Notifications"
              subtitle="Manage your notification preferences"
              onPress={() => {
                Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
              }}
            />
            {!isMaster && (
            <SettingsItem
              icon={<FileText size={20} color="#8b5cf6" />}
              title="Activity Logs"
                subtitle="View your activity history"
                onPress={() => router.push('/audit/audit')}
            />
            )}
          </View>
        </View>

        <IfMaster>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon={<Users size={20} color="#2563eb" />}
                title="User Management"
                subtitle="Manage users and permissions"
                onPress={() => router.push('/user-management')}
              />
              <SettingsItem
                icon={<AlertTriangle size={20} color="#ef4444" />}
                title="Stock Alerts"
                subtitle="View and manage stock alerts"
                onPress={() => router.push('/alerts')}
                badge={unresolvedAlertsCount}
              />
              <SettingsItem
                icon={<FileText size={20} color="#8b5cf6" />}
                title="Audit Logs"
                subtitle="View system activity and changes"
                onPress={() => router.push('/audit/audit')}
              />
              <SettingsItem
                icon={<MapPin size={20} color="#10b981" />}
                title="Location Management"
                subtitle="Manage warehouse locations"
                onPress={() => setShowLocationManagement(true)}
              />
            </View>
          </View>
        </IfMaster>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<Info size={20} color="#6b7280" />}
              title="Demo Information"
              subtitle="View demo credentials and features"
              onPress={() => router.push('/demo-info')}
            />
          </View>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon={<TestTube size={20} color="#8b5cf6" />}
                title="Crash Testing"
                subtitle="Test error handling and crash prevention"
                onPress={() => setShowCrashTesting(true)}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<LogOut size={20} color="#ef4444" />}
              title={isLoggingOut ? "Logging out..." : "Logout"}
              subtitle="Sign out of your account"
              onPress={() =>  handleLogout()}
              showChevron={false}
              danger={true}
              disabled={isLoggingOut}
            />
          </View>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      {user && (
        <Modal
          isVisible={showEditProfileModal}
          onBackdropPress={() => setShowEditProfileModal(false)}
          onBackButtonPress={() => setShowEditProfileModal(false)}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.editProfileModalContainer}
          avoidKeyboard={true}
        >
          <View style={styles.editProfileModalContent}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editProfileScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <EditProfileForm
                isOwnProfile={true}
                user={user}
                onCancel={() => setShowEditProfileModal(false)}
                onSuccess={() => {
                  setShowEditProfileModal(false);
                  // Success message
                  Alert.alert(
                    'Profile Updated',
                    'Your profile has been successfully updated.'
                  );
                }}
                fieldsToShow={['name', 'email', 'password', 'username']} // Exclude 'role' for self-editing
              />
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Crash Testing Modal */}
      <Modal
        isVisible={showCrashTesting}
        onBackdropPress={() => setShowCrashTesting(false)}
        onBackButtonPress={() => setShowCrashTesting(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937' }}>Crash Testing</Text>
            <TouchableOpacity onPress={() => setShowCrashTesting(false)}>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <CrashTestComponent onTestComplete={() => {}} />
        </View>
      </Modal>
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
    minHeight: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  locationHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'black',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  profileDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  settingsGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#fef2f2',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  dangerText: {
    color: '#ef4444',
  },
  disabledText: {
    color: '#9ca3af',
  },
  settingsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  editProfileModalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  editProfileModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  editProfileScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});