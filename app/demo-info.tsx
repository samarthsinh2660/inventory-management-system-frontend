import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Crown, Key } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DemoInfo() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Demo Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Credentials</Text>
          <Text style={styles.description}>
            This is a demo version of the Inventory Management System. Use the following credentials to explore different user roles:
          </Text>

          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <Crown size={20} color="#f59e0b" />
              <Text style={styles.credentialTitle}>Master User (Admin)</Text>
            </View>
            <View style={styles.credentialRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.credentialText}>Username: admin</Text>
            </View>
            <View style={styles.credentialRow}>
              <Key size={16} color="#6b7280" />
              <Text style={styles.credentialText}>Password: admin123</Text>
            </View>
            <Text style={styles.credentialDescription}>
              Full access to all features including user management, product creation, alerts, and audit logs.
            </Text>
          </View>

          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <User size={20} color="#6b7280" />
              <Text style={styles.credentialTitle}>Employee User</Text>
            </View>
            <View style={styles.credentialRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.credentialText}>Username: employee1</Text>
            </View>
            <View style={styles.credentialRow}>
              <Key size={16} color="#6b7280" />
              <Text style={styles.credentialText}>Password: emp123</Text>
            </View>
            <Text style={styles.credentialDescription}>
              Limited access to dashboard, products view, and inventory entry. Cannot manage users or access admin features.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Data</Text>
          <Text style={styles.description}>
            The demo includes pre-populated sample data:
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• 8 sample products across different categories</Text>
            <Text style={styles.featureItem}>• 3 warehouse locations</Text>
            <Text style={styles.featureItem}>• 5 product subcategories</Text>
            <Text style={styles.featureItem}>• 10 inventory entries with recent activity</Text>
            <Text style={styles.featureItem}>• 4 active stock alerts for low inventory</Text>
            <Text style={styles.featureItem}>• 5 audit log entries showing system changes</Text>
            <Text style={styles.featureItem}>• 2 manufacturing formulas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Dashboard with real-time inventory overview</Text>
            <Text style={styles.featureItem}>• Product management with categories and stock tracking</Text>
            <Text style={styles.featureItem}>• Inventory entry system for stock in/out operations</Text>
            <Text style={styles.featureItem}>• Automated low stock alerts and notifications</Text>
            <Text style={styles.featureItem}>• User management with role-based access control</Text>
            <Text style={styles.featureItem}>• Comprehensive audit logging for all changes</Text>
            <Text style={styles.featureItem}>• Manufacturing formulas for production tracking</Text>
            <Text style={styles.featureItem}>• Multi-location inventory management</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Limitations</Text>
          <Text style={styles.description}>
            This is a frontend demo with mock data. In a production environment:
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Data would be persisted to a real database</Text>
            <Text style={styles.featureItem}>• API endpoints would handle server-side logic</Text>
            <Text style={styles.featureItem}>• Authentication would use secure tokens</Text>
            <Text style={styles.featureItem}>• Real-time notifications would be implemented</Text>
            <Text style={styles.featureItem}>• Advanced reporting and analytics features</Text>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  credentialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  credentialDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});