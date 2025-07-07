import React from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { EditProfileForm } from './EditProfileForm';
import { EditUserModalProps } from '@/types/user';



export const EditUserModal = ({ isVisible, onClose, user, onSuccess }: EditUserModalProps) => {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <EditProfileForm 
              user={user} 
              isOwnProfile={false} 
              onSuccess={handleSuccess}
              onCancel={onClose}
              // Allow masters to edit all fields of other users
              fieldsToShow={['name', 'email', 'username', 'role', 'password']}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
