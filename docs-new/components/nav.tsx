"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  Download,
  ChevronDown,
  Github,
  ExternalLink,
  Trash2,
  Grid2X2,
  Home,
  FileText,
  File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/cn"
import { ModeToggle } from "./mode-toggle"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Debloat Script", href: "/debloat", icon: Trash2 },
  { name: "Apps", href: "/apps", icon: Grid2X2 },
  { name: "Patch Notes", href: "/patch-notes", icon: FileText },
  { name: "Docs", href: "/docs", icon: File },
]

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Discord</title>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [version, setVersion] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    async function fetchVersion() {
      try {
        const response = await fetch("https://api.github.com/repos/parcoil/sparkle/releases/latest")
        const data = await response.json()
        setVersion(data.tag_name)
      } catch (error) {
        console.error("Failed to fetch version:", error)
      }
    }
    fetchVersion()
  }, [])

  function handleDownload(type: "exe" | "zip") {
    if (type === "exe") {
      window.open(
        `https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace("v", "")}-setup.exe`,
        "_blank",
      )
    } else {
      window.open(
        `https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace("v", "")}-win.zip`,
        "_blank",
      )
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full min-w-screen transition-all duration-300",
        scrolled ? "border-b bg-background/80 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/sparklelogo.png" alt="Sparkle Logo" className="h-8 w-auto" />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent">
                Sparkle
              </span>
            </Link>
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <div className="flex items-center space-x-2">
              <a
                href="https://dsc.gg/parcoil"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Discord Server"
              >
                <DiscordIcon className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/Parcoil/Sparkle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                aria-label="GitHub repository"
              >
                <Github className="h-5 w-5" />
              </a>
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="ml-2">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => handleDownload("exe")}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Installer (.exe)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("zip")}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Portable (.zip)</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground/70 hover:text-foreground focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t bg-background/95 backdrop-blur-lg md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-accent/50 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="space-y-2 px-3 py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">GitHub</span>
                <a
                  href="https://github.com/Parcoil/Sparkle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="GitHub repository"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">Theme</span>
                <ModeToggle />
              </div>
              <p className="text-center text-sm text-primary">
                Visit on desktop to download Sparkle
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
