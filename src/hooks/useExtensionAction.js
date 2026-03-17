import { useCallback } from 'react';

export function useExtensionAction() {
  const sendMessageToBackground = useCallback((action, payload = {}) => {
    return new Promise((resolve, reject) => {
      // Chrome extension API check
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Extension message error:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } else {
        // Fallback for local development bounding box
        console.warn("Chrome extension API not available. Action:", action, payload);
        resolve({ mock: true, status: "Extension API not found" });
      }
    });
  }, []);

  const sendMessageToContentScript = useCallback(async (tabId, action, payload = {}) => {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.sendMessage) {
        chrome.tabs.sendMessage(tabId, { action, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
             console.error("Content script msg error:", chrome.runtime.lastError);
             reject(chrome.runtime.lastError);
          } else {
             resolve(response);
          }
        });
      } else {
         console.warn("Chrome tabs API not available. Action:", action, payload);
         resolve({ mock: true });
      }
    });
  }, []);

  const getActiveTab = useCallback(async () => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs[0]); // Returns the active tab
        });
      } else {
        resolve({ url: window.location.href, title: document.title, id: 0 }); // Mock tab
      }
    });
  });

  return {
    sendMessageToBackground,
    sendMessageToContentScript,
    getActiveTab
  };
}
