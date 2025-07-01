import { Platform } from 'react-native';

// Polyfill for BackHandler on web platform
if (Platform.OS === 'web') {
  const { BackHandler } = require('react-native');
  
  // Use Object.defineProperty to ensure methods are properly defined
  if (!BackHandler.removeEventListener) {
    Object.defineProperty(BackHandler, 'removeEventListener', {
      value: () => {
        // No-op for web platform
        return true;
      },
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  
  if (!BackHandler.addEventListener) {
    Object.defineProperty(BackHandler, 'addEventListener', {
      value: () => {
        // No-op for web platform - return a subscription object
        return {
          remove: () => {},
        };
      },
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
} else {
  // Handle native platforms as well
  const { BackHandler } = require('react-native');
  
  // Some versions of React Native may have API inconsistencies
  // on native platforms
  if (!BackHandler.removeEventListener) {
    Object.defineProperty(BackHandler, 'removeEventListener', {
      value: BackHandler.remove || (() => {}),
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
}