import { cn } from "@/lib/utils"

/**
 * Renders a styled card container and merges any provided class names with the component's default styles.
 *
 * @param {Object} params - Component props.
 * @param {import('react').ReactNode} params.children - Content to render inside the card.
 * @param {string} [params.className] - Additional CSS class names appended to the default classes.
 * @param {Object} [params.props] - Additional props spread onto the root div (e.g., id, data-*, event handlers).
 * @returns {import('react').ReactElement} A div element styled as a card containing the provided children.
 */
function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-sparkle-card border border-sparkle-border/50 rounded-3xl hover:border-sparkle-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out group backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card