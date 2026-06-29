"use client"

import { useState, useEffect, useCallback } from "react"
import { Sun, Moon } from "lucide-react"

const THEME_KEY = "lcc-theme"

type Theme = "dark" | "light"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    if (stored === "light" || stored === "dark") {
      setThemeState(stored)
      document.documentElement.setAttribute("data-theme", stored)
    } else {
      // Default to dark if nothing stored
      document.documentElement.setAttribute("data-theme", "dark")
    }
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.setAttribute("data-theme", t)
    try { localStorage.setItem(THEME_KEY, t) } catch {}
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return { theme, setTheme, toggle }
}

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="btn-ghost text-xs"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  )
}
