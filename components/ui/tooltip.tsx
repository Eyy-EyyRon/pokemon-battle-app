"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple tooltip implementation without external dependencies
const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("inline-block", className)} {...props} />,
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 rounded-md border bg-white px-3 py-1.5 text-sm text-gray-800 shadow-md",
        className,
      )}
      {...props}
    />
  ),
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
