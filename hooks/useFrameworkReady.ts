import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Check if window exists (web platform) before accessing it
    if (typeof window !== 'undefined') {
      window.frameworkReady?.();
    }
  });
}