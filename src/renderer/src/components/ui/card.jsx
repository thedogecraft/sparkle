import { cn } from "@/lib/utils"

/**
 * Render a styled card container that merges base layout classes with any provided classes.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Content rendered inside the card.
 * @param {string} [props.className] - Additional Tailwind-style classes appended to the component's base classes.
 * @param {Object} [props.props] - Additional props spread onto the root div (e.g., event handlers, id, style).
 * @returns {import('react').JSX.Element} The card element.
 */
function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-sparkle-card border border-sparkle-border/50 rounded-3xl hover:border-sparkle-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out group backdrop-blur-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card