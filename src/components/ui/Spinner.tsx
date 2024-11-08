"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LOADING_PATTERNS } from "@/design/tokens"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof LOADING_PATTERNS.spinner.sizes
  color?: keyof typeof LOADING_PATTERNS.spinner.colors
}

export function Spinner({ 
  size = "md", 
  color = "brand",
  className,
  ...props 
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        LOADING_PATTERNS.spinner.base,
        LOADING_PATTERNS.spinner.sizes[size],
        LOADING_PATTERNS.spinner.colors[color],
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="animate-spin"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  )
} 