import React from 'react'
import { cn } from "@/lib/utils"

/**
 * Render a styled input element with configurable type, initial value, and change handler.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.type='text'] - The input's HTML type attribute.
 * @param {string|number} [props.defaultValue] - The initial value for an uncontrolled input.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} [props.onChange] - Change event handler.
 * @param {string} [props.className] - Additional CSS classes to append to the component's base styles.
 * @param {string} [props.placeholder] - Placeholder text shown when the input is empty.
 * @param {Object} [props.props] - Additional native input attributes passed through to the element.
 * @returns {JSX.Element} The rendered input element.
 */
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


/**
 * Render a rounded, bordered text input with an optional leading icon and visible focus styling.
 * @param {Object} props - Component props.
 * @param {string} [props.placeholder] - Placeholder text shown when the input is empty.
 * @param {string} [props.value] - Controlled input value.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} [props.onChange] - Change handler for the input.
 * @param {React.ComponentType<any>} [props.icon] - Optional icon component rendered to the left of the input.
 * @param {string} [props.className] - Additional classes applied to the outer wrapper.
 * @param {...any} [props.props] - Additional props forwarded to the underlying <input> element.
 * @returns {JSX.Element} The composed input wrapper containing the optional icon and text input.
 */
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
