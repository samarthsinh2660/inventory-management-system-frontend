import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Home } from 'lucide-react-native';
import { router } from 'expo-router';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, log less detailed info for security
    if (__DEV__) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    } else {
      console.error('Application error occurred:', error.message);
    }
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to crash reporting service (like Crashlytics, Sentry, etc.)
    // if (!__DEV__) {
    //   crashlytics().recordError(error);
    // }
  }

  handleGoHome = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Navigate to home/dashboard
    try {
      // Navigate to the main index which will handle auth routing
      router.replace('/');
    } catch (navError) {
      console.error('Navigation error after crash:', navError);
      // Fallback: reload the app if navigation fails
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleGoHome} />;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <AlertTriangle size={48} color="#ef4444" />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {__DEV__ 
                ? 'A component error occurred during development. Check the console for details.'
                : 'We encountered an unexpected error. Let\'s get you back to a safe place.'
              }
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                <Text style={styles.debugText}>{this.state.error.stack}</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.homeButton} onPress={this.handleGoHome}>
              <Home size={20} color="white" />
              <Text style={styles.homeText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  debugInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  homeButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  homeText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ErrorBoundary; 