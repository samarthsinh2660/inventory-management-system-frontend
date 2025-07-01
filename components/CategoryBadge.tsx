import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryBadgeProps {
  category: 'raw' | 'semi' | 'finished';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const getColor = () => {
    switch (category) {
      case 'raw': return '#6b7280';
      case 'semi': return '#3b82f6';
      case 'finished': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getColor() }]}>
      <Text style={styles.text}>{category.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});