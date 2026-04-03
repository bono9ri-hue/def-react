"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Standardized Icon Component
 * Decouples Lucide icon selection from design system sizing.
 * Aligns with the Button/Avatar scale (xs, sm, default, lg).
 */
const iconVariants = cva("", {
  variants: {
    size: {
      default: "w-5 h-5", // 20px
      sm: "w-4 h-4",      // 16px
      xs: "w-3.5 h-3.5",  // 14px
      lg: "w-6 h-6",      // 24px
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export function Icon({ name: LucideIcon, size = "default", className, ...props }) {
  if (!LucideIcon) return null;
  return (
    <LucideIcon 
      className={cn(iconVariants({ size, className }))} 
      strokeWidth={1.5}
      {...props} 
    />
  );
}
