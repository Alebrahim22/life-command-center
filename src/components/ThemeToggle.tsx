"use client"

import { useState, useEffect, useCallback } from "react"
import { Moon, Sun } from "lucide-react"
import { useLocale } from "@/lib/i18n"

const THEME_KEY = "lcc-theme"

type Theme = "dark" | "light"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null
      if (saved === "light" || saved === "dark") {
        setThemeState(saved)
        document.documentElement.setAttribute("data-theme", saved)
      }
    } catch {}
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.setAttribute("data-theme", t)
    try { localStorage.setItem(THEME_KEY, t) } catch {}
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      document.documentElement.setAttribute("data-theme", next)
      try { localStorage.setItem(THEME_KEY, next) } catch {}
      return next
    })
  }, [])

  return { theme, setTheme, toggle }
}

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useLocale()

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 btn-ghost text-xs active:scale-95 touch-action-manipulation"
      title={theme === "dark" ? t("themeToggle.darkTooltip") : t("themeToggle.lightTooltip")}
    >
      {theme === "dark" ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? t("themeToggle.darkLabel") : t("themeToggle.lightLabel")}
      </span>
    </button>
  )
}
