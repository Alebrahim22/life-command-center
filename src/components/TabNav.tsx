"use client"

import { useState, useEffect } from "react"

interface Tab {
  id: string
  label: string
}

const TABS: Tab[] = [
  { id: "today", label: "Today" },
  { id: "work", label: "Work & Tasks" },
  { id: "finance", label: "Finance" },
  { id: "business", label: "Business" },
  { id: "more", label: "More" },
]

const STORAGE_KEY = "active-tab"

interface Props {
  onTabChange: (tab: string) => void
}

export default function TabNav({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState("today")

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
    <div className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl overflow-x-auto px-4 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-[#666] hover:text-[#a0a0a0]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
