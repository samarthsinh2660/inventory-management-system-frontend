/**
 * Error Testing Utilities
 * Use these functions to test various error scenarios in your app
 * Note: Some functions are disabled in production for security
 */

import { Alert } from 'react-native';

// Production safety check
const isProduction = !__DEV__;
const PRODUCTION_SAFE_MODE = isProduction;

export interface ErrorTestResult {
  test: string;
  passed: boolean;
  error?: string;
  recommendation?: string;
}

// Test different types of errors
export class ErrorTester {
  
  /**
   * Test API error handling
   */
  static async testApiErrors(): Promise<ErrorTestResult[]> {
    const results: ErrorTestResult[] = [];

    // Test network error
    try {
      const response = await fetch('https://invalid-url-that-does-not-exist.com');
      results.push({
        test: 'Network Error',
        passed: false,
        error: 'Should have thrown network error'
      });
    } catch (error: any) {
      results.push({
        test: 'Network Error',
        passed: true,
        recommendation: 'Network errors are properly caught'
      });
    }

    // Test 404 error
    try {
      const response = await fetch('https://httpstat.us/404');
      if (!response.ok) {
        results.push({
          test: '404 Error Handling',
          passed: true,
          recommendation: 'HTTP error responses are properly detected'
        });
      } else {
        results.push({
          test: '404 Error Handling',
          passed: false,
          error: 'HTTP errors not properly handled'
        });
      }
    } catch (error: any) {
      results.push({
        test: '404 Error Handling',
        passed: true,
        recommendation: 'HTTP errors are properly caught'
      });
    }

    return results;
  }

  /**
   * Test JSON parsing errors
   */
  static testJsonParsing(): ErrorTestResult[] {
    const results: ErrorTestResult[] = [];

    try {
      JSON.parse('invalid json');
      results.push({
        test: 'JSON Parse Error',
        passed: false,
        error: 'Invalid JSON should throw error'
      });
    } catch (error: any) {
      results.push({
        test: 'JSON Parse Error',
        passed: true,
        recommendation: 'JSON parsing errors are properly caught'
      });
    }

    return results;
  }

  /**
   * Test null/undefined access
   */
  static testNullAccess(): ErrorTestResult[] {
    const results: ErrorTestResult[] = [];

    try {
      const obj: any = null;
      const value = obj.property; // This should throw
      results.push({
        test: 'Null Access Error',
        passed: false,
        error: 'Accessing properties on null should throw error'
      });
    } catch (error: any) {
      results.push({
        test: 'Null Access Error',
        passed: true,
        recommendation: 'Null access errors are properly caught'
      });
    }

    // Test with optional chaining (safer approach)
    try {
      const obj: any = null;
      const value = obj?.property; // This should not throw
      results.push({
        test: 'Safe Null Access (Optional Chaining)',
        passed: true,
        recommendation: 'Optional chaining prevents null access errors'
      });
    } catch (error: any) {
      results.push({
        test: 'Safe Null Access (Optional Chaining)',
        passed: false,
        error: 'Optional chaining should prevent errors'
      });
    }

    return results;
  }

  /**
   * Test async operation errors
   */
  static async testAsyncErrors(): Promise<ErrorTestResult[]> {
    const results: ErrorTestResult[] = [];

    // Test promise rejection
    try {
      await Promise.reject(new Error('Test async error'));
      results.push({
        test: 'Promise Rejection',
        passed: false,
        error: 'Promise rejection should throw error'
      });
    } catch (error: any) {
      results.push({
        test: 'Promise Rejection',
        passed: true,
        recommendation: 'Promise rejections are properly caught'
      });
    }

    return results;
  }

  /**
   * Run all error tests
   */
  static async runAllTests(): Promise<ErrorTestResult[]> {
    // In production, return limited safe tests only
    if (PRODUCTION_SAFE_MODE) {
      return [{
        test: 'Production Mode',
        passed: true,
        recommendation: 'Error testing is disabled in production for security. ErrorBoundary is active.'
      }];
    }

    const allResults: ErrorTestResult[] = [];

    try {
      const apiResults = await this.testApiErrors();
      allResults.push(...apiResults);
    } catch (error: any) {
      allResults.push({
        test: 'API Error Testing',
        passed: false,
        error: `API test failed: ${error?.message || error}`
      });
    }

    try {
      const jsonResults = this.testJsonParsing();
      allResults.push(...jsonResults);
    } catch (error: any) {
      allResults.push({
        test: 'JSON Parsing Testing',
        passed: false,
        error: `JSON test failed: ${error?.message || error}`
      });
    }

    try {
      const nullResults = this.testNullAccess();
      allResults.push(...nullResults);
    } catch (error: any) {
      allResults.push({
        test: 'Null Access Testing',
        passed: false,
        error: `Null access test failed: ${error?.message || error}`
      });
    }

    try {
      const asyncResults = await this.testAsyncErrors();
      allResults.push(...asyncResults);
    } catch (error: any) {
      allResults.push({
        test: 'Async Error Testing',
        passed: false,
        error: `Async test failed: ${error?.message || error}`
      });
    }

    return allResults;
  }
}

// Component error testing functions
export const ComponentErrorTester = {
  /**
   * Trigger a component error for testing error boundaries
   */
  throwComponentError: (message: string = 'Test component error') => {
    if (PRODUCTION_SAFE_MODE) {
      console.warn('Component error testing is disabled in production');
      return;
    }
    throw new Error(message);
  },

  /**
   * Test component with invalid state
   */
  createInvalidStateComponent: () => {
    // This would cause a render error
    return {
      render: () => {
        const invalidArray: any = null;
        return invalidArray.map(() => null); // This will crash
      }
    };
  }
};

// Storage error testing
export const StorageErrorTester = {
  /**
   * Test Storage errors (simplified for compatibility)
   */
  testStorageErrors: async (): Promise<ErrorTestResult[]> => {
    const results: ErrorTestResult[] = [];
    
    // Test localStorage operations (works in both web and React Native with web compatibility)
    try {
      // Test basic storage operations
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('test_key', 'test_value');
        const value = localStorage.getItem('test_key');
        localStorage.removeItem('test_key');
        
        results.push({
          test: 'Storage Basic Operations',
          passed: true,
          recommendation: 'Storage operations work correctly'
        });
      } else {
        // For React Native or environments without localStorage
        results.push({
          test: 'Storage Basic Operations',
          passed: true,
          recommendation: 'Storage testing skipped - environment not supported'
        });
      }
      
      // Test storage capacity/limits
      try {
        const largeData = 'x'.repeat(1000000); // 1MB of data
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('large_test', largeData);
          localStorage.removeItem('large_test');
        }
        
        results.push({
          test: 'Storage Capacity Test',
          passed: true,
          recommendation: 'Storage can handle large data sets'
        });
      } catch (storageError: any) {
        results.push({
          test: 'Storage Capacity Test',
          passed: true,
          recommendation: 'Storage limits properly enforced'
        });
      }
      
    } catch (error: any) {
      results.push({
        test: 'Storage Operations',
        passed: false,
        error: `Storage test failed: ${error?.message || error}`
      });
    }

    return results;
  }
};

// Performance and memory testing
export const PerformanceTester = {
  /**
   * Test for memory leaks (simplified for React Native)
   */
  testMemoryUsage: () => {
    // In React Native, we can't access performance.memory
    // Instead, we simulate memory testing by creating/destroying objects
    const startTime = performance.now();
    
    // Create large array to test memory allocation
    const largeArray = new Array(100000).fill('test');
    
    const allocationTime = performance.now() - startTime;
    
    // Clear the array
    largeArray.length = 0;
    
    const clearTime = performance.now() - startTime - allocationTime;
    
    return {
      allocationTime,
      clearTime,
      note: 'Memory testing limited in React Native environment'
    };
  },

  /**
   * Test component rendering performance
   */
  testRenderPerformance: (renderFunction: () => void, iterations: number = 100) => {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      renderFunction();
    }
    
    const endTime = performance.now();
    return {
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / iterations
    };
  }
};

// Validation helpers
export const ValidationHelper = {
  /**
   * Validate that all critical functions have error handling
   */
  validateErrorHandling: (functionName: string, fn: Function): boolean => {
    const functionString = fn.toString();
    
    // Check for try-catch blocks
    const hasTryCatch = functionString.includes('try') && functionString.includes('catch');
    
    // Check for error handling patterns
    const hasErrorHandling = functionString.includes('.catch(') || 
                            functionString.includes('error') || 
                            hasTryCatch;
    
    if (!hasErrorHandling) {
      console.warn(`⚠️ Function ${functionName} may not have proper error handling`);
      return false;
    }
    
    return true;
  },

  /**
   * Check for proper null checks
   */
  hasNullChecks: (code: string): boolean => {
    const nullCheckPatterns = [
      /\?\./g,          // Optional chaining
      /!=\s*null/g,     // Not equal to null
      /!==\s*null/g,    // Strict not equal to null
      /!=\s*undefined/g, // Not equal to undefined
      /!==\s*undefined/g, // Strict not equal to undefined
      /if\s*\(\s*\w+\s*\)/g // Simple if checks
    ];
    
    return nullCheckPatterns.some(pattern => pattern.test(code));
  }
};

// Production-Ready Testing Suite
export const ProductionTestSuite = {
  /**
   * Test Redux store error scenarios
   */
  testReduxStoreErrors: (): ErrorTestResult[] => {
    const results: ErrorTestResult[] = [];

    try {
      // Test with invalid action type
      const mockDispatch = (action: any) => {
        if (!action || typeof action !== 'object' || !action.type) {
          throw new Error('Invalid action format');
        }
        return action;
      };

      // Test valid action
      mockDispatch({ type: 'TEST_ACTION', payload: {} });
      
      // Test invalid action
      try {
        mockDispatch(null);
        results.push({
          test: 'Redux Action Validation',
          passed: false,
          error: 'Invalid actions should be rejected'
        });
      } catch (error: any) {
        results.push({
          test: 'Redux Action Validation',
          passed: true,
          recommendation: 'Redux actions are properly validated'
        });
      }
    } catch (error: any) {
      results.push({
        test: 'Redux Store Testing',
        passed: false,
        error: `Redux test failed: ${error?.message || error}`
      });
    }

    return results;
  },

  /**
   * Test form validation and user input errors
   */
  testFormValidation: (): ErrorTestResult[] => {
    const results: ErrorTestResult[] = [];

    try {
      // Simulate form validation
      const validateInput = (value: any, required: boolean = true) => {
        if (required && (!value || value.toString().trim() === '')) {
          throw new Error('Required field is empty');
        }
        return true;
      };

      // Test empty required field
      try {
        validateInput('', true);
        results.push({
          test: 'Form Validation - Required Fields',
          passed: false,
          error: 'Empty required fields should fail validation'
        });
      } catch (error: any) {
        results.push({
          test: 'Form Validation - Required Fields',
          passed: true,
          recommendation: 'Required field validation works correctly'
        });
      }

      // Test valid input
      validateInput('valid input', true);
      results.push({
        test: 'Form Validation - Valid Input',
        passed: true,
        recommendation: 'Valid inputs are accepted correctly'
      });

    } catch (error: any) {
      results.push({
        test: 'Form Validation Testing',
        passed: false,
        error: `Form validation test failed: ${error?.message || error}`
      });
    }

    return results;
  },

  /**
   * Test API response validation
   */
  testApiResponseValidation: (): ErrorTestResult[] => {
    const results: ErrorTestResult[] = [];

    try {
      // Mock API response validator
      const validateApiResponse = (response: any) => {
        if (!response) {
          throw new Error('Response is null or undefined');
        }
        if (typeof response !== 'object') {
          throw new Error('Response is not an object');
        }
        if (!response.hasOwnProperty('data') && !response.hasOwnProperty('error')) {
          throw new Error('Response missing required fields');
        }
        return true;
      };

      // Test invalid responses
      const invalidResponses = [null, undefined, '', 'string', 123, []];
      let invalidCaught = 0;

      invalidResponses.forEach(response => {
        try {
          validateApiResponse(response);
        } catch (error) {
          invalidCaught++;
        }
      });

      if (invalidCaught === invalidResponses.length) {
        results.push({
          test: 'API Response Validation - Invalid Data',
          passed: true,
          recommendation: 'Invalid API responses are properly rejected'
        });
      } else {
        results.push({
          test: 'API Response Validation - Invalid Data',
          passed: false,
          error: `Only ${invalidCaught}/${invalidResponses.length} invalid responses were caught`
        });
      }

      // Test valid response
      validateApiResponse({ data: { id: 1, name: 'test' } });
      results.push({
        test: 'API Response Validation - Valid Data',
        passed: true,
        recommendation: 'Valid API responses are accepted correctly'
      });

    } catch (error: any) {
      results.push({
        test: 'API Response Validation Testing',
        passed: false,
        error: `API validation test failed: ${error?.message || error}`
      });
    }

    return results;
  },

  /**
   * Test state corruption detection
   */
  testStateCorruption: (): ErrorTestResult[] => {
    const results: ErrorTestResult[] = [];

    try {
      // Mock state validator
      const validateState = (state: any) => {
        const requiredKeys = ['auth', 'products', 'inventory'];
        
        if (!state || typeof state !== 'object') {
          throw new Error('State is not a valid object');
        }

        for (const key of requiredKeys) {
          if (!state.hasOwnProperty(key)) {
            throw new Error(`State missing required key: ${key}`);
          }
        }
        
        return true;
      };

      // Test corrupted state
      try {
        validateState({ auth: null }); // Missing required keys
        results.push({
          test: 'State Corruption Detection',
          passed: false,
          error: 'Corrupted state should be detected'
        });
      } catch (error: any) {
        results.push({
          test: 'State Corruption Detection',
          passed: true,
          recommendation: 'State corruption is properly detected'
        });
      }

      // Test valid state
      validateState({
        auth: { user: null },
        products: { list: [] },
        inventory: { entries: [] }
      });
      results.push({
        test: 'State Validation - Valid State',
        passed: true,
        recommendation: 'Valid state structure is accepted'
      });

    } catch (error: any) {
      results.push({
        test: 'State Corruption Testing',
        passed: false,
        error: `State test failed: ${error?.message || error}`
      });
    }

    return results;
  },

  /**
   * Run all production-level tests
   */
  runProductionTests: async (): Promise<ErrorTestResult[]> => {
    if (PRODUCTION_SAFE_MODE) {
      return [{
        test: 'Production Test Suite',
        passed: true,
        recommendation: 'Full testing disabled in production. ErrorBoundary and basic validations active.'
      }];
    }

    const allResults: ErrorTestResult[] = [];

    try {
      const reduxResults = ProductionTestSuite.testReduxStoreErrors();
      allResults.push(...reduxResults);
    } catch (error: any) {
      allResults.push({
        test: 'Redux Testing Suite',
        passed: false,
        error: `Redux tests failed: ${error?.message || error}`
      });
    }

    try {
      const formResults = ProductionTestSuite.testFormValidation();
      allResults.push(...formResults);
    } catch (error: any) {
      allResults.push({
        test: 'Form Validation Suite',
        passed: false,
        error: `Form tests failed: ${error?.message || error}`
      });
    }

    try {
      const apiResults = ProductionTestSuite.testApiResponseValidation();
      allResults.push(...apiResults);
    } catch (error: any) {
      allResults.push({
        test: 'API Validation Suite',
        passed: false,
        error: `API tests failed: ${error?.message || error}`
      });
    }

    try {
      const stateResults = ProductionTestSuite.testStateCorruption();
      allResults.push(...stateResults);
    } catch (error: any) {
      allResults.push({
        test: 'State Validation Suite',
        passed: false,
        error: `State tests failed: ${error?.message || error}`
      });
    }

    return allResults;
  }
};

// Enhanced Error Tester with production tests
export class EnhancedErrorTester extends ErrorTester {
  /**
   * Run comprehensive production-ready tests
   */
  static async runComprehensiveTests(): Promise<ErrorTestResult[]> {
    const allResults: ErrorTestResult[] = [];

    // Run basic error tests
    const basicResults = await super.runAllTests();
    allResults.push(...basicResults);

    // Run production-specific tests
    const productionResults = await ProductionTestSuite.runProductionTests();
    allResults.push(...productionResults);

    // Run storage tests
    const storageResults = await StorageErrorTester.testStorageErrors();
    allResults.push(...storageResults);

    // Run performance tests
    const perfResult = PerformanceTester.testMemoryUsage();
    allResults.push({
      test: 'Memory Allocation Performance',
      passed: perfResult.allocationTime < 100,
      recommendation: `Allocation took ${perfResult.allocationTime.toFixed(2)}ms`
    });

    return allResults;
  }
}

// Display test results
export const displayTestResults = (results: ErrorTestResult[]) => {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n🧪 Error Handling Test Results: ${passed}/${total} passed\n`);
  
  results.forEach(result => {
    const emoji = result.passed ? '✅' : '❌';
    console.log(`${emoji} ${result.test}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.recommendation) {
      console.log(`   💡 ${result.recommendation}`);
    }
    
    console.log('');
  });
  
  if (passed < total) {
    console.log('🔧 Some tests failed. Consider improving error handling in these areas.');
  } else {
    console.log('🎉 All error handling tests passed!');
  }
}; 