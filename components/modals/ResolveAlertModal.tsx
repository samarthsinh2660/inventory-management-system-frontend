import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { X, Package, AlertTriangle } from 'lucide-react-native';
import { Notification } from '@/types/alerts';

interface ResolveAlertModalProps {
  visible: boolean;
  onClose: () => void;
  notification: Notification | null;
  onResolve: (quantity: number) => Promise<void>;
}

export default function ResolveAlertModal({ 
  visible, 
  onClose, 
  notification, 
  onResolve 
}: ResolveAlertModalProps) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!notification) return;
    
    const quantityNumber = parseFloat(quantity);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive quantity.');
      return;
    }

    try {
      setLoading(true);
      await onResolve(quantityNumber);
      setQuantity('');
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    onClose();
  };

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <AlertTriangle size={24} color="#ef4444" />
              <Text style={styles.title}>Resolve Stock Alert</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.productInfo}>
              <Package size={20} color="#2563eb" />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{notification.product_name}</Text>
                <Text style={styles.locationName}>{notification.location_name}</Text>
              </View>
            </View>

            <View style={styles.stockInfo}>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Current Stock:</Text>
                <Text style={[styles.stockValue, { color: '#ef4444' }]}>
                  {notification.current_stock}
                </Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Required:</Text>
                <Text style={styles.stockValue}>
                  {notification.min_threshold}
                </Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Shortage:</Text>
                <Text style={[styles.stockValue, { color: '#ef4444' }]}>
                  {Math.max(0, notification.min_threshold - notification.current_stock)}
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Quantity to Add *</Text>
              <TextInput
                mode="outlined"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Enter quantity to add"
                style={styles.input}
                disabled={loading}
              />
              <Text style={styles.inputHint}>
                This will create a "Manual In" inventory entry
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.button}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleResolve}
              style={styles.button}
              loading={loading}
              disabled={loading || !quantity.trim()}
            >
              Resolve & Add Stock
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  locationName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  stockInfo: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
  },
}); 