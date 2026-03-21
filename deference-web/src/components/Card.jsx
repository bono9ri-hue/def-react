"use client";

import React from 'react';
import { cn } from './Button';

export const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:border-text-muted/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-5 border-b border-border", className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-4 bg-surface/50 border-t border-border flex items-center", className)} {...props}>
      {children}
    </div>
  );
};
