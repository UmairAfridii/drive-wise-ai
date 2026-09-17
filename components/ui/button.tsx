import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "icon" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50",
          {
            // Variants
            "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]":
              variant === "primary",
            "border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white":
              variant === "secondary",
            "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white":
              variant === "icon",
            "bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white":
              variant === "ghost",

            // Sizes
            "h-11 px-6 rounded-full": size === "default" && variant !== "icon",
            "h-9 px-4 rounded-full text-xs": size === "sm" && variant !== "icon",
            "h-12 px-8 rounded-full text-base": size === "lg" && variant !== "icon",
            "size-9 rounded-xl": size === "icon" || variant === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
