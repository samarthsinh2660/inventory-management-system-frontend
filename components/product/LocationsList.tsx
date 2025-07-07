import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MapPin, Edit2, Trash2, Plus } from 'lucide-react-native';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { deleteLocation } from '../../store/slices/locationsSlice';
import { IfMaster } from '../../components/IfMaster';
import { LocationsListProps, LocationDisplayItem } from '@/types/product';



export const LocationsList: React.FC<LocationsListProps> = ({ 
  locations, 
  onCreateLocation, 
  onEditLocation 
}) => {
  const dispatch = useAppDispatch();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteLocation = (location: LocationDisplayItem) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(location.id);
              await dispatch(deleteLocation(location.id)).unwrap();
              Alert.alert('Success', 'Location deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete location');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderLocationItem = ({ item }: { item: LocationDisplayItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          {item.address && (
            <Text style={styles.itemDescription}>{item.address}</Text>
          )}
        </View>
        <IfMaster>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditLocation(item)}
            >
              <Edit2 size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteLocation(item)}
              disabled={deletingId === item.id}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </IfMaster>
      </View>
      
      {item.address && (
        <View style={styles.itemDetails}>
          <Text style={styles.itemDetailLabel}>Address:</Text>
          <Text style={styles.itemDetailValue}>{item.address}</Text>
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
        <Text style={styles.title}>Locations</Text>
        <IfMaster>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateLocation}
          >
            <Plus size={16} color="white" />
            <Text style={styles.createButtonText}>Add Location</Text>
          </TouchableOpacity>
        </IfMaster>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No locations found</Text>
            <IfMaster>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={onCreateLocation}
              >
                <Text style={styles.createFirstButtonText}>Create First Location</Text>
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