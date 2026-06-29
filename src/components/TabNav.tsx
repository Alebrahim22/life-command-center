"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  TrendingUp,
  Building2,
} from "lucide-react"

interface Tab {
  id: string
  label: string
  icon: React.ElementType
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "finance", label: "Finance", icon: TrendingUp },
  { id: "business", label: "Business", icon: Building2 },
]

const STORAGE_KEY = "active-tab"

interface Props {
  onTabChange: (tab: string) => void
}

export default function TabNav({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && TABS.some((t) => t.id === saved)) {
      setActiveTab(saved)
      onTabChange(saved)
    }
  }, [])

  function selectTab(id: string) {
    setActiveTab(id)
    localStorage.setItem(STORAGE_KEY, id)
    onTabChange(id)
  }

  return (
    <>
      {/* ============ DESKTOP: Top Nav (Glass) ============ */}
      <nav className="hidden md:block sticky top-0 z-20 border-b border-border bg-bg-glass backdrop-blur-2xl supports-[backdrop-filter]:bg-bg-glass">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`relative flex items-center gap-2.5 shrink-0 px-5 py-3.5 text-sm font-medium transition-all duration-200 min-h-[48px] ${
                    active
                      ? "text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-all duration-200 ${
                    active ? "text-accent" : ""
                  }`} />
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-accent/80 to-accent rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ============ MOBILE: Bottom Nav (Glass) ============ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-bg-glass-strong backdrop-blur-2xl supports-[backdrop-filter]:bg-bg-glass-strong pb-safe">
        <div className="flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[64px] px-3 py-2 transition-all duration-200 ${
                  active
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className={`relative flex items-center justify-center transition-all duration-200 ${
                  active
                    ? "after:absolute after:inset-[-4px] after:rounded-full after:border after:border-accent/20 after:shadow-[0_0_12px_rgba(34,197,94,0.06)]"
                    : ""
                }`}>
                  <Icon className={`h-[22px] w-[22px] transition-all duration-200 ${
                    active ? "drop-shadow-[0_0_6px_rgba(34,197,94,0.3)]" : ""
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight tracking-wide uppercase ${
                  active ? "text-accent" : "text-text-muted"
                }`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
