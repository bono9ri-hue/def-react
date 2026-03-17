import React, { useEffect } from 'react';
import { cn } from './Button';

export const Dialog = ({ isOpen, onClose, title, children, className }) => {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/80 animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      <div 
        className={cn(
          "relative w-full max-w-[400px] bg-background border border-border rounded-xl shadow-minimal dark:shadow-minimal-dark overflow-hidden animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-[15px] font-semibold text-content tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-contentMuted hover:text-content hover:bg-surface rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};
