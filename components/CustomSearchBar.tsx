import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { CustomSearchBarProps } from '@/types/product';

export const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChangeText,
  onClear,
  style,
  autoFocus = false,
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Search size={20} color="#6b7280" style={styles.searchIcon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never" // We'll handle clear button manually
      />
      {value.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0, // Remove default padding to center text
    height: '100%',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});