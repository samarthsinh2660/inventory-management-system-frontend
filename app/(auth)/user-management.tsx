import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users as UsersIcon, Plus, Trash2, Crown, User, ArrowLeft, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchUsers, deleteUser } from '../../store/slices/usersSlice';
import { CreateUserModal } from '../../components/modals/CreateUserModal';
import { EditUserModal } from '../../components/modals/EditUserModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import Toast from 'react-native-toast-message';
import { User as UserType } from '../../store/slices/authSlice';

export default function UserManagement() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list: users, loading } = useAppSelector(state => state.users);
  const currentUser = useAppSelector(state => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchUsers());
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDeleteUser = (userId: number, username: string) => {
    if (userId === currentUser?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'You cannot delete your own account',
      });
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteUser(userId)).unwrap();
              Toast.show({
                type: 'success',
                text1: 'User Deleted',
                text2: `User "${username}" has been deleted`,
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete user',
              });
            }
          },
        },
      ]
    );
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const renderUser = ({ item }: { item: UserType }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userIcon}>
          {item.role === 'master' ? (
            <Crown size={20} color="#f59e0b" />
          ) : (
            <User size={20} color="#6b7280" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.role}>
            {item.role === 'master' ? 'Master User' : 'Employee'}
          </Text>
          {item.name && (
            <Text style={styles.name}>Name: {item.name}</Text>
          )}
          {item.email && (
            <Text style={styles.email}>Email: {item.email}</Text>
          )}
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditUser(item)}
          >
            <Edit2 size={18} color="#2563eb" />
          </TouchableOpacity>
          {item.id !== currentUser?.id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteUser(item.id, item.username)}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.userFooter}>
        <Text style={styles.createdDate}>
          {item.created_at && `Created: ${new Date(item.created_at).toLocaleDateString()}`}
        </Text>
        {item.id === currentUser?.id && (
          <Text style={styles.currentUserBadge}>You</Text>
        )}
      </View>
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
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <UsersIcon size={24} color="#2563eb" />
          <View>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>{users.length} total users</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <UsersIcon size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create First User</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <CreateUserModal
        isVisible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      {selectedUser && (
        <EditUserModal
          isVisible={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={selectedUser}
          onSuccess={() => {
            dispatch(fetchUsers());
            setShowEditModal(false);
          }}
        />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  name: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  currentUserBadge: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});