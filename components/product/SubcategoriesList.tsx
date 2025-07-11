import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Tag, Edit2, Trash2, Plus } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { deleteSubcategory } from '../../store/slices/subcategoriesSlice';
import { IfMaster } from '../../components/IfMaster';
import { Subcategory, SubcategoriesListProps, SubcategoryDisplayItem, SubcategoryRenderItem } from '@/types/product';


export const SubcategoriesList: React.FC<SubcategoriesListProps> = ({ 
  subcategories, 
  onCreateSubcategory, 
  onEditSubcategory 
}) => {
  const dispatch = useAppDispatch();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    Alert.alert(
      'Delete Subcategory',
      `Are you sure you want to delete "${subcategory.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(subcategory.id);
              await dispatch(deleteSubcategory(subcategory.id)).unwrap();
              Alert.alert('Success', 'Subcategory deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete subcategory');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderSubcategoryItem = ({ item }: SubcategoryRenderItem) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Tag size={16} color="#6b7280" />
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
        </View>
        <IfMaster>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditSubcategory(item)}
            >
              <Edit2 size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteSubcategory(item)}
              disabled={deletingId === item.id}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </IfMaster>
      </View>
      
      {item.parent_category && (
        <View style={styles.itemDetails}>
          <Text style={styles.itemDetailLabel}>Parent Category:</Text>
          <Text style={styles.itemDetailValue}>{item.parent_category}</Text>
        </View>
      )}
      
      {item.products_count !== undefined && (
        <View style={styles.itemFooter}>
          <Text style={styles.itemCount}>
            {item.products_count} product{item.products_count !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subcategories</Text>
        <IfMaster>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateSubcategory}
          >
            <Plus size={16} color="white" />
            <Text style={styles.createButtonText}>Add Subcategory</Text>
          </TouchableOpacity>
        </IfMaster>
      </View>

      <FlatList
        data={subcategories as SubcategoryDisplayItem[]}
        renderItem={renderSubcategoryItem}
        keyExtractor={(item: SubcategoryDisplayItem) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Tag size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No subcategories found</Text>
            <IfMaster>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={onCreateSubcategory}
              >
                <Text style={styles.createFirstButtonText}>Create First Subcategory</Text>
              </TouchableOpacity>
            </IfMaster>
          </View>
        }
      />
    </View>
  );
};

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
    fontWeight: '700',
    color: '#1f2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
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
  itemDetails: {
    marginBottom: 8,
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 2,
  },
  itemFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemCount: {
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
    marginBottom: 24,
    textAlign: 'center',
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