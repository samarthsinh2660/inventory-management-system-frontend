import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Package, MapPin, Tag, Flask } from 'lucide-react-native';
import { LocationsList } from './LocationsList';
import { SubcategoriesList } from './SubcategoriesList';
import { FormulasList } from './FormulasList';

interface ManagementTabsProps {
  products: any[];
  subcategories: any[];
  locations: any[];
  formulas: any[];
  onCreateLocation: () => void;
  onEditLocation: (location: any) => void;
  onCreateSubcategory: () => void;
  onEditSubcategory: (subcategory: any) => void;
  onCreateFormula: () => void;
  onEditFormula: (formula: any) => void;
  onBackToProducts: () => void;
}

type TabType = 'products' | 'locations' | 'subcategories' | 'formulas';

export const ManagementTabs: React.FC<ManagementTabsProps> = ({
  products,
  subcategories,
  locations,
  formulas,
  onCreateLocation,
  onEditLocation,
  onCreateSubcategory,
  onEditSubcategory,
  onCreateFormula,
  onEditFormula,
  onBackToProducts,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const tabs = [
    { 
      id: 'products' as TabType, 
      title: 'Products', 
      icon: Package, 
      count: products.length 
    },
    { 
      id: 'locations' as TabType, 
      title: 'Locations', 
      icon: MapPin, 
      count: locations.length 
    },
    { 
      id: 'subcategories' as TabType, 
      title: 'Categories', 
      icon: Tag, 
      count: subcategories.length 
    },
    { 
      id: 'formulas' as TabType, 
      title: 'Formulas', 
      icon: Flask, 
      count: formulas.length 
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <View style={styles.tabContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBackToProducts}
            >
              <Text style={styles.backButtonText}>← Back to Products View</Text>
            </TouchableOpacity>
          </View>
        );
      case 'locations':
        return (
          <LocationsList
            locations={locations}
            onCreateLocation={onCreateLocation}
            onEditLocation={onEditLocation}
          />
        );
      case 'subcategories':
        return (
          <SubcategoriesList
            subcategories={subcategories}
            onCreateSubcategory={onCreateSubcategory}
            onEditSubcategory={onEditSubcategory}
          />
        );
      case 'formulas':
        return (
          <FormulasList
            formulas={formulas}
            onCreateFormula={onCreateFormula}
            onEditFormula={onEditFormula}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon 
                size={16} 
                color={isActive ? '#2563eb' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText,
                isActive && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
              <View style={[
                styles.countBadge,
                isActive && styles.activeCountBadge
              ]}>
                <Text style={[
                  styles.countText,
                  isActive && styles.activeCountText
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#dbeafe',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeCountText: {
    color: '#2563eb',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});