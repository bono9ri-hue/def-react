"use client";

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  isLoading,
  ...props 
}, ref) => {
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus:outline-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-content text-background hover:opacity-90 shadow-sm',
    secondary: 'bg-surface text-content border border-border hover:bg-surfaceHover',
    ghost: 'bg-transparent text-contentMuted hover:text-content hover:bg-surfaceHover',
    danger: 'bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/20',
  };

  const sizes = {
    sm: 'text-xs h-8 px-3 rounded-[6px]',
    md: 'text-[13px] h-9 px-4 rounded-[8px]',
    lg: 'text-sm h-11 px-6 rounded-[10px]',
    icon: 'h-9 w-9 rounded-[8px]',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
