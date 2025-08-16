import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchPurchaseInfo, deletePurchaseInfo } from '../../store/slices/purchaseInfoSlice';
import { SuppliersList } from '../../components/suppliers/SuppliersList';
import { CreatePurchaseInfoModal } from '../../components/modals/CreatePurchaseInfoModal';
import { PurchaseInfo } from '../../types/product';
import Toast from 'react-native-toast-message';

export default function ManageSuppliers() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list: suppliers, loading, error } = useAppSelector(state => state.purchaseInfo);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<PurchaseInfo | null>(null);

  useEffect(() => {
    // Fetch suppliers on component mount
    dispatch(fetchPurchaseInfo());
  }, [dispatch]);

  useEffect(() => {
    // Fetch suppliers when search query changes (with debounce)
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        dispatch(fetchPurchaseInfo(searchQuery.trim()));
      } else {
        dispatch(fetchPurchaseInfo());
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, dispatch]);

  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setShowCreateModal(true);
  };

  const handleEditSupplier = (supplier: PurchaseInfo) => {
    setEditingSupplier(supplier);
    setShowCreateModal(true);
  };

  const handleDeleteSupplier = (id: number) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.business_name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePurchaseInfo(id)).unwrap();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Supplier deleted successfully',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete supplier',
              });
            }
          },
        },
      ]
    );
  };

  const handleModalSuccess = () => {
    // Refresh suppliers list
    if (searchQuery.trim()) {
      dispatch(fetchPurchaseInfo(searchQuery.trim()));
    } else {
      dispatch(fetchPurchaseInfo());
    }
    setShowCreateModal(false);
    setEditingSupplier(null);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingSupplier(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Suppliers</Text>
        <TouchableOpacity onPress={handleCreateSupplier} style={styles.addButton}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search suppliers by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
          right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        <SuppliersList
          suppliers={suppliers}
          onEditSupplier={handleEditSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          loading={loading}
        />
      </View>

      <CreatePurchaseInfoModal
        isVisible={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingPurchaseInfo={editingSupplier || undefined}
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
