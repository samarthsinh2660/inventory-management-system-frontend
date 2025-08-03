import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Building2, Phone, Mail, MapPin, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react-native';
import { PurchaseInfo } from '@/types/product';

interface SuppliersListProps {
  suppliers: PurchaseInfo[];
  onEditSupplier: (supplier: PurchaseInfo) => void;
  onDeleteSupplier: (id: number) => void;
  loading?: boolean;
}

interface SupplierItemProps {
  supplier: PurchaseInfo;
  onEdit: () => void;
  onDelete: () => void;
}

const SupplierItem: React.FC<SupplierItemProps> = ({ supplier, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.card}>
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.supplierInfo}>
            <Building2 size={20} color="#2563eb" />
            <Text style={styles.businessName}>{supplier.business_name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Edit size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
            {expanded ? (
              <ChevronDown size={20} color="#6b7280" />
            ) : (
              <ChevronRight size={20} color="#6b7280" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {supplier.address && (
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>{supplier.address}</Text>
            </View>
          )}
          
          {supplier.phone_number && (
            <View style={styles.detailRow}>
              <Phone size={16} color="#6b7280" />
              <Text style={styles.detailText}>{supplier.phone_number}</Text>
            </View>
          )}
          
          {supplier.email && (
            <View style={styles.detailRow}>
              <Mail size={16} color="#6b7280" />
              <Text style={styles.detailText}>{supplier.email}</Text>
            </View>
          )}
          
          {supplier.gst_number && (
            <View style={styles.detailRow}>
              <Text style={styles.gstLabel}>GST:</Text>
              <Text style={styles.detailText}>{supplier.gst_number}</Text>
            </View>
          )}
          
          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>
              Created: {new Date(supplier.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

export const SuppliersList: React.FC<SuppliersListProps> = ({
  suppliers,
  onEditSupplier,
  onDeleteSupplier,
  loading = false,
}) => {
  const renderSupplier = ({ item }: { item: PurchaseInfo }) => (
    <SupplierItem
      supplier={item}
      onEdit={() => onEditSupplier(item)}
      onDelete={() => onDeleteSupplier(item.id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading suppliers...</Text>
      </View>
    );
  }

  if (suppliers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Building2 size={48} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No Suppliers Found</Text>
        <Text style={styles.emptySubtitle}>
          Create your first supplier to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suppliers}
      renderItem={renderSupplier}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  gstLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 40,
  },
  timestampRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  timestampText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
