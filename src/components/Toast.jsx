import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from './Button';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-minimal dark:shadow-minimal-dark border text-[13px] font-medium bg-surface border-border",
            toast.type === 'success' ? "text-content" :
            toast.type === 'error' ? "text-red-500 border-red-500/10" :
            "text-contentMuted"
          )}>
            {toast.type === 'success' && <span className="text-[14px]">✓</span>}
            {toast.type === 'error' && <span className="text-[14px]">!</span>}
            {toast.message}
            
            {toast.type === 'success' && (
              <a 
                href="https://deference.work" 
                target="_blank" 
                rel="noreferrer"
                className="ml-2 bg-content text-background px-2.5 py-1 rounded-[6px] text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                View
              </a>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
