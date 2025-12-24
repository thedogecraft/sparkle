import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { createPortal } from "react-dom"

export function Dropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef(null)

  // Update effect to close on resize/scroll for safety
  useEffect(() => {
    function handleResize() {
      if (isOpen) setIsOpen(false)
    }
    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleResize, true)
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleResize, true)
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".dropdown-portal")
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="px-5 py-2.5 rounded-full border border-sparkle-border bg-sparkle-bg/50 backdrop-blur-sm text-sparkle-text hover:border-sparkle-primary transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-between shadow-sm hover:shadow-md active:scale-95"
      >
        <span className="text-sm font-medium">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-sparkle-text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>
      {isOpen &&
        createPortal(
          <div
            className="dropdown-portal fixed z-[9999] overflow-hidden bg-sparkle-card border border-sparkle-border-secondary rounded-2xl shadow-xl flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left transition-all duration-150 text-sm ${value === option
                    ? "text-sparkle-primary font-medium bg-sparkle-primary/10"
                    : "text-sparkle-text hover:bg-sparkle-border/50"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
