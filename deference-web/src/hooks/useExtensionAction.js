"use client";

import { useCallback } from 'react';

/**
 * ⚠️ Note: This hook was used for browser extension interaction.
 * In the standalone web app, it provides mock fallbacks to prevent errors.
 */
export function useExtensionAction() {
  const sendMessageToBackground = useCallback((action, payload = {}) => {
    return new Promise((resolve) => {
      console.warn("Chrome extension API not available in web mode. Action:", action, payload);
      resolve({ mock: true, status: "Extension API not found" });
    });
  }, []);

  const sendMessageToContentScript = useCallback(async (tabId, action, payload = {}) => {
    return new Promise((resolve) => {
      console.warn("Chrome tabs API not available in web mode. Action:", action, payload);
      resolve({ mock: true });
    });
  }, []);

  const getActiveTab = useCallback(async () => {
    return new Promise((resolve) => {
      // Web environment fallback
      resolve({ 
        url: typeof window !== 'undefined' ? window.location.href : '', 
        title: typeof document !== 'undefined' ? document.title : '', 
        id: 0 
      }); 
    });
  }, []);

  return {
    sendMessageToBackground,
    sendMessageToContentScript,
    getActiveTab
  };
}
