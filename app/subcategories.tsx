import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { SubcategoriesList } from '../components/product/SubcategoriesList';
import { CreateSubcategoryModal } from '../components/modals/CreateSubcategoryModal';
import { fetchSubcategories } from '../store/slices/subcategoriesSlice';
import { Subcategory } from '@/types/product';

export default function SubcategoriesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const subcategories = useAppSelector(state => state.subcategories.list);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    dispatch(fetchSubcategories());
  }, [dispatch]);

  const handleCreateSubcategory = () => {
    setEditingSubcategory(null);
    setShowCreateModal(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingSubcategory(null);
    // Refresh subcategories after modal closes
    dispatch(fetchSubcategories());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Subcategories</Text>
        <View style={{ width: 24 }} />
      </View>

      <SubcategoriesList
        subcategories={subcategories}
        onCreateSubcategory={handleCreateSubcategory}
        onEditSubcategory={handleEditSubcategory}
      />

      <CreateSubcategoryModal
        isVisible={showCreateModal}
        onClose={handleModalClose}
        editingSubcategory={editingSubcategory || undefined}
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
}); 