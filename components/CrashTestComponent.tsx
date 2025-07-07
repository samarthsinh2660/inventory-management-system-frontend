import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { 
  ErrorTester, 
  ComponentErrorTester, 
  StorageErrorTester, 
  PerformanceTester,
  EnhancedErrorTester,
  ProductionTestSuite,
  displayTestResults,
  ErrorTestResult 
} from '../utils/errorTesting';

interface CrashTestComponentProps {
  onTestComplete?: (results: ErrorTestResult[]) => void;
}

const CrashTestComponent: React.FC<CrashTestComponentProps> = ({ onTestComplete }) => {
  const [testResults, setTestResults] = useState<ErrorTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Screen size detection for mobile responsiveness
  const { width: screenWidth } = screenData;
  const isMobileWidth = screenWidth < 768;

  // Production mode check
  const isProduction = !__DEV__;

  // This will trigger a component error to test error boundary
  if (shouldCrash && !isProduction) {
    ComponentErrorTester.throwComponentError('Test crash triggered by user');
  }

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      console.log('🧪 Starting comprehensive error handling tests...');
      
      const results = await ErrorTester.runAllTests();
      
      // Add storage tests
      const storageResults = await StorageErrorTester.testStorageErrors();
      results.push(...storageResults);
      
      // Add performance test
      const perfResult = PerformanceTester.testMemoryUsage();
      results.push({
        test: 'Memory Allocation Performance',
        passed: perfResult.allocationTime < 100,
        recommendation: `Allocation took ${perfResult.allocationTime.toFixed(2)}ms`
      });

      setTestResults(results);
      displayTestResults(results);
      onTestComplete?.(results);
      
    } catch (error) {
      console.error('Test suite failed:', error);
      setTestResults([{
        test: 'Test Suite Execution',
        passed: false,
        error: `Test suite crashed: ${error}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      console.log('🚀 Starting comprehensive production-ready tests...');
      
      const results = await EnhancedErrorTester.runComprehensiveTests();
      
      // Add additional production tests
      const productionResults = await ProductionTestSuite.runProductionTests();
      results.push(...productionResults);

      setTestResults(results);
      displayTestResults(results);
      onTestComplete?.(results);
      
    } catch (error) {
      console.error('Comprehensive test suite failed:', error);
      setTestResults([{
        test: 'Comprehensive Test Suite Execution',
        passed: false,
        error: `Comprehensive test suite crashed: ${error}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runApiTest = async () => {
    setIsRunning(true);
    try {
      const results = await ErrorTester.testApiErrors();
      setTestResults(results);
      displayTestResults(results);
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testComponentCrash = () => {
    Alert.alert(
      'Component Crash Test',
      'This will trigger a component error to test the Error Boundary. The app should not crash but show an error screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Trigger Crash', 
          style: 'destructive',
          onPress: () => setShouldCrash(true)
        }
      ]
    );
  };

  const testNullAccess = () => {
    try {
      const obj: any = null;
      console.log(obj.nonExistentProperty.anotherProperty);
    } catch (error) {
      Alert.alert('Success!', 'Null access error was caught properly');
      console.log('✅ Null access error caught:', error);
    }
  };

  const testAsyncError = async () => {
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Async operation failed')), 1000);
      });
    } catch (error) {
      Alert.alert('Success!', 'Async error was caught properly');
      console.log('✅ Async error caught:', error);
    }
  };

  const testNetworkError = async () => {
    try {
      const response = await fetch('https://invalid-url-12345.com');
      Alert.alert('Unexpected', 'Network request should have failed');
    } catch (error) {
      Alert.alert('Success!', 'Network error was caught properly');
      console.log('✅ Network error caught:', error);
    }
  };

  const PassedTest = ({ test }: { test: ErrorTestResult }) => (
    <View style={styles.testItem}>
      <Text style={styles.passedTest}>✅ {test.test}</Text>
      {test.recommendation && (
        <Text style={styles.recommendation}>{test.recommendation}</Text>
      )}
    </View>
  );

  const FailedTest = ({ test }: { test: ErrorTestResult }) => (
    <View style={styles.testItem}>
      <Text style={styles.failedTest}>❌ {test.test}</Text>
      {test.error && (
        <Text style={styles.error}>Error: {test.error}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, isMobileWidth && styles.mobileContainer]}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>🧪 Crash Prevention Testing</Title>
          <Paragraph>
            {isProduction 
              ? 'Error testing is limited in production for security. Error Boundary protection is active.'
              : 'Test your app\'s error handling and crash prevention mechanisms. Production Tests include Redux validation, form validation, API response validation, and state corruption detection.'
            }
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Tests</Title>
          <View style={isMobileWidth ? styles.mobileButtonGrid : styles.buttonGrid}>
            <Button 
              mode="outlined" 
              onPress={testNullAccess}
              style={isMobileWidth ? styles.mobileTestButton : styles.testButton}
            >
              Test Null Access
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={testAsyncError}
              style={isMobileWidth ? styles.mobileTestButton : styles.testButton}
            >
              Test Async Error
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={testNetworkError}
              style={isMobileWidth ? styles.mobileTestButton : styles.testButton}
            >
              Test Network Error
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={testComponentCrash}
              style={[
                isMobileWidth ? styles.mobileTestButton : styles.testButton, 
                styles.dangerButton
              ]}
            >
              Test Component Crash
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Comprehensive Tests</Title>
          <View style={isMobileWidth ? styles.mobileButtonGrid : styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={runApiTest}
              disabled={isRunning}
              style={isMobileWidth ? styles.mobileTestButton : styles.mainButton}
            >
              Run API Tests
            </Button>
            
            <Button 
              mode="contained" 
              onPress={runAllTests}
              disabled={isRunning}
              style={isMobileWidth ? styles.mobileTestButton : styles.mainButton}
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </Button>
          </View>

          <View style={[isMobileWidth ? styles.mobileButtonGrid : styles.buttonRow, { marginTop: 12 }]}>
            <Button 
              mode="contained" 
              onPress={runComprehensiveTests}
              disabled={isRunning}
              style={[
                isMobileWidth ? styles.mobileTestButton : styles.mainButton,
                { backgroundColor: '#10b981' }
              ]}
            >
              {isRunning ? 'Running...' : 'Run Production Tests'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {testResults.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Test Results</Title>
            <Divider style={styles.divider} />
            
            {testResults.map((test, index) => (
              test.passed ? 
                <PassedTest key={index} test={test} /> : 
                <FailedTest key={index} test={test} />
            ))}
            
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {testResults.filter(t => t.passed).length} / {testResults.length} tests passed
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Error Prevention Tips</Title>
          <View style={styles.tips}>
            <Text style={styles.tip}>• Always use try-catch for async operations</Text>
            <Text style={styles.tip}>• Use optional chaining (?) for object access</Text>
            <Text style={styles.tip}>• Validate data before processing</Text>
            <Text style={styles.tip}>• Handle network errors gracefully</Text>
            <Text style={styles.tip}>• Use Error Boundaries for component errors</Text>
            <Text style={styles.tip}>• Test with invalid/missing data</Text>
            <Text style={styles.tip}>• Monitor performance and memory usage</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  mobileContainer: {
    padding: 12,
  },
  card: {
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  mobileButtonGrid: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    minHeight: 56,
  },
  mobileTestButton: {
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
  },
  mainButton: {
    flex: 1,
    minHeight: 56,
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
  divider: {
    marginVertical: 12,
  },
  testItem: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    minHeight: 48,
  },
  passedTest: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
  },
  failedTest: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  recommendation: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  summary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 56,
  },
  summaryText: {
    fontWeight: '700',
    fontSize: 16,
  },
  tips: {
    marginTop: 12,
  },
  tip: {
    color: '#4b5563',
    marginBottom: 6,
    lineHeight: 22,
    fontSize: 14,
    paddingVertical: 2,
  },
});

export default CrashTestComponent;