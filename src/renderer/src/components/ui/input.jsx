import React from 'react'
import { cn } from "@/lib/utils"

/**
 * Renders a styled input element using the project's Sparkle UI styles.
 *
 * @param {string} [type] - Input type attribute (e.g., "text", "email").
 * @param {string} [defaultValue] - Initial value for an uncontrolled input.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Change event handler.
 * @param {string} [className] - Additional CSS classes to merge with the component's default classes.
 * @param {string} [placeholder] - Placeholder text displayed when the input is empty.
 * @param {...any} [props] - Additional attributes forwarded to the underlying input element.
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
 * Render a rounded, stylized text input with an optional leading icon.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.placeholder] - Placeholder text shown when the input is empty.
 * @param {string|number} [props.value] - Current input value.
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} [props.onChange] - Change handler for the input.
 * @param {import('react').ComponentType<unknown>} [props.icon] - Optional icon component rendered to the left of the input.
 * @param {string} [props.className] - Additional CSS classes applied to the outer container.
 * @param {...any} [props.props] - Additional props forwarded to the inner input element.
 * @returns {import('react').ReactElement} A React element representing the large stylized input with optional icon.
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
