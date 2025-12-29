import { cn } from "@/lib/utils"

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
