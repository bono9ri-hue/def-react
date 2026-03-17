import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl border text-sm font-medium backdrop-blur-xl",
            toast.type === 'success' ? "bg-black/80 border-white/20 text-white" :
            toast.type === 'error' ? "bg-red-950/80 border-red-500/30 text-red-100" :
            "bg-[#111]/90 border-white/10 text-gray-200"
          )}>
            {toast.type === 'success' && <span className="text-white">✨</span>}
            {toast.type === 'error' && <span className="text-red-400">🚨</span>}
            {toast.message}
            
            {toast.type === 'success' && (
              <a 
                href="https://deference.work" 
                target="_blank" 
                rel="noreferrer"
                className="ml-2 bg-white text-black px-3 py-1 rounded-full text-[11px] font-bold hover:scale-105 transition-transform"
              >
                View ↗
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
