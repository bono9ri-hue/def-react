import * as React from "react"
import { cn } from "@/lib/utils"

const Empty = ({ className, ...props }) => (
  <div
    className={cn(
      "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in zoom-in duration-300",
      className
    )}
    {...props}
  />
)
Empty.displayName = "Empty"

const EmptyHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col items-center gap-2", className)} {...props} />
)
EmptyHeader.displayName = "EmptyHeader"

const EmptyMedia = ({ className, variant = "icon", ...props }) => (
  <div
    className={cn(
      "flex items-center justify-center rounded-full bg-muted",
      variant === "icon" ? "h-12 w-12" : "h-20 w-20",
      className
    )}
    {...props}
  />
)
EmptyMedia.displayName = "EmptyMedia"

const EmptyTitle = ({ className, ...props }) => (
  <h3
    className={cn("text-xl font-semibold tracking-tight", className)}
    {...props}
  />
)
EmptyTitle.displayName = "EmptyTitle"

const EmptyDescription = ({ className, ...props }) => (
  <p
    className={cn("max-w-sm text-sm text-muted-foreground", className)}
    {...props}
  />
)
EmptyDescription.displayName = "EmptyDescription"

const EmptyContent = ({ className, ...props }) => (
  <div className={cn("mt-6 flex items-center gap-4", className)} {...props} />
)
EmptyContent.displayName = "EmptyContent"

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
}
