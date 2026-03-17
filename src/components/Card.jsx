import React from 'react';
import { cn } from './Button';

export const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-[#141414]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/10",
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
    <div className={cn("p-4 border-b border-white/5", className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-4 bg-black/20 border-t border-white/5 flex items-center", className)} {...props}>
      {children}
    </div>
  );
};
