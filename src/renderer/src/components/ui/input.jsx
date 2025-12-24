import React from 'react'
import { cn } from "@/lib/utils"

function Input({ type, defaultValue, onChange, className, placeholder, ...props }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cn(
        "w-full bg-sparkle-card/50 backdrop-blur-sm border border-sparkle-border rounded-full px-5 py-2.5 text-sparkle-text",
        "focus:ring-2 focus:ring-sparkle-primary/20 focus:outline-hidden focus:border-sparkle-primary transition-all",
        className
      )}
      placeholder={placeholder}
      {...props}
    />
  )
}


function LargeInput({ placeholder, value, onChange, icon: Icon, className, ...props }) {
  return (
    <div className={cn(
      "flex items-center gap-3 bg-sparkle-card/50 border border-sparkle-border",
      "rounded-full px-6 backdrop-blur-md transition-all",
      "focus-within:border-sparkle-primary focus-within:ring-2 focus-within:ring-sparkle-primary/20",
      className
    )}>
      {Icon && <Icon className="w-5 h-5 text-sparkle-text-secondary" />}
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full py-3 px-0 bg-transparent border-none",
          "focus:outline-hidden focus:ring-0 text-sparkle-text",
          "placeholder:text-sparkle-text-secondary"
        )}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}

export { Input, LargeInput }

