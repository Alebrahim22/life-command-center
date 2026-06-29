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
      {/* ============ DESKTOP: Top Nav ============ */}
      <nav className="hidden md:block sticky top-0 z-10 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`relative flex items-center gap-2 shrink-0 px-5 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                    active
                      ? "text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ============ MOBILE: Bottom Nav ============ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-bg-primary/95 backdrop-blur-sm pb-safe">
        <div className="flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] px-2 py-1.5 transition-colors ${
                  active
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
