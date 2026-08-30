import { useEffect, useState } from "react"

interface RootDivProps {
  children: React.ReactNode
  [key: string]: any
}

type AnimationMode = "up" | "left" | "off"

const getStoredAnimation = (): AnimationMode => {
  if (typeof window === "undefined") {
    return "up"
  }

  const stored = window.localStorage.getItem("pageAnimation")
  return stored === "left" || stored === "off" ? stored : "up"
}

const getInitialStyle = (mode: AnimationMode) => ({
  opacity: mode === "off" ? 1 : 0,
  transform:
    mode === "left"
      ? "translateX(90px)"
      : mode === "off"
      ? "none"
      : "translateY(90px)",
  transition:
    mode === "off"
      ? "none"
      : "opacity 0.6s cubic-bezier(0.075,0.82,0.165,1), transform 0.6s cubic-bezier(0.075,0.82,0.165,1)",
})

function RootDiv({ children, ...props }: RootDivProps): React.ReactElement {
  const [style, setStyle] = useState(() => getInitialStyle(getStoredAnimation()))

  useEffect(() => {
    const animationMode = getStoredAnimation()

    if (animationMode === "off") {
      setStyle((prev) => ({
        ...prev,
        opacity: 1,
        transform: "none",
        transition: "none",
      }))
      return
    }

    const timeout = setTimeout(() => {
      setStyle((prev) => ({
        ...prev,
        opacity: 1,
        transform:
          animationMode === "left" ? "translateX(0)" : "translateY(0)",
      }))
    }, 10)

    return () => {
      setStyle((prev) => ({
        ...prev,
        opacity: 0,
        transform:
          animationMode === "left" ? "translateX(90px)" : "translateY(90px)",
      }))
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div
      style={{
        ...style,
        height: "calc(100vh - 50px)",
        overflowY: "auto",
      }}
      {...props}
      className="overflow-x-hidden"
    >
      {children}
    </div>
  )
}

export default RootDiv
