"use client"

import { useState, useCallback } from "react"
import HeaderStrip from "@/components/HeaderStrip"
import TabNav from "@/components/TabNav"
import QuickActionFab from "@/components/QuickActionFab"
import PrayerTimes from "@/components/PrayerTimes"
import WeatherWidget from "@/components/WeatherWidget"
import ShiftTracker from "@/components/ShiftTracker"
import TodoList from "@/components/TodoList"
import UpcomingEvents from "@/components/UpcomingEvents"
import PortfolioTracker from "@/components/PortfolioTracker"
import BillsTracker from "@/components/BillsTracker"
import BudgetSnapshot from "@/components/BudgetSnapshot"
import TradingJournal from "@/components/TradingJournal"
import ProjectsTracker from "@/components/ProjectsTracker"
import LegalCases from "@/components/LegalCases"
import HabitTracker from "@/components/HabitTracker"
import OsoulArchitect from "@/components/OsoulArchitect"
import NewsFeed from "@/components/NewsFeed"
import CommandCenter from "@/components/CommandCenter"
import AuthGuard from "@/components/AuthGuard"
import { Wallet, ChartCandlestick } from "lucide-react"

// Premium Section wrapper
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 animate-fade-slide-up ${className}`}>{children}</div>
}

// Premium Grid wrapper
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">{children}</div>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview")
  const [financeView, setFinanceView] = useState<"tracker" | "osoul">("tracker")

  // FAB Quick Actions → navigate to correct tab
  const handleAddTodo = useCallback(() => setActiveTab("work"), [])
  const handleLogShift = useCallback(() => setActiveTab("work"), [])
  const handleMarkHabits = useCallback(() => {
    setActiveTab("today")
    // Scroll to habits section
    setTimeout(() => {
      document.getElementById("habits-section")?.scrollIntoView({ behavior: "smooth" })
    }, 200)
  }, [])
  const handleQuickNote = useCallback(() => setActiveTab("work"), [])

  return (
    <AuthGuard>
    <div className="min-h-screen bg-bg-primary pb-[72px] md:pb-0">
      <HeaderStrip />
      <TabNav onTabChange={setActiveTab} />

      {activeTab === "overview" ? (
        <CommandCenter />
      ) : (
      <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        {/* ==================== TODAY TAB ==================== */}
        {activeTab === "today" && (
          <div key="today-tab" className="animate-fade-slide-up">
            <Grid>
              <PrayerTimes />
              <WeatherWidget />
            </Grid>
            <Grid>
              <div id="habits-section">
                <HabitTracker />
              </div>
              <NewsFeed />
            </Grid>
          </div>
        )}

        {/* ==================== WORK TAB ==================== */}
        {activeTab === "work" && (
          <div key="work-tab" className="animate-fade-slide-up">
            <Section>
              <ShiftTracker />
            </Section>
            <Grid>
              <TodoList />
              <UpcomingEvents />
            </Grid>
          </div>
        )}

        {/* ==================== FINANCE TAB ==================== */}
        {activeTab === "finance" && (
          <div key="finance-tab" className="animate-fade-slide-up">
            {/* Premium Sub-tab toggle: Tracker / Osoul */}
            <Section>
              <div className="glass-card-static inline-flex p-1">
                <button
                  onClick={() => setFinanceView("tracker")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                    financeView === "tracker"
                      ? "bg-accent text-white shadow-[0_2px_12px_rgba(34,197,94,0.2)]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  Tracker
                </button>
                <button
                  onClick={() => setFinanceView("osoul")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                    financeView === "osoul"
                      ? "bg-accent text-white shadow-[0_2px_12px_rgba(34,197,94,0.2)]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <ChartCandlestick className="h-4 w-4" />
                  Osoul
                </button>
              </div>
            </Section>

            {financeView === "tracker" ? (
              <div key="finance-tracker" className="animate-fade-slide-up">
                <Section>
                  <PortfolioTracker />
                </Section>
                <Grid>
                  <BillsTracker />
                  <BudgetSnapshot />
                </Grid>
                <Section>
                  <TradingJournal />
                </Section>
              </div>
            ) : (
              <Section>
                <OsoulArchitect />
              </Section>
            )}
          </div>
        )}

        {/* ==================== BUSINESS TAB ==================== */}
        {activeTab === "business" && (
          <div key="business-tab" className="animate-fade-slide-up">
            <Section>
              <ProjectsTracker />
            </Section>
            <Section>
              <LegalCases />
            </Section>
          </div>
        )}
      </div>
    )}

      <QuickActionFab
        onAddTodo={handleAddTodo}
        onLogShift={handleLogShift}
        onMarkHabits={handleMarkHabits}
        onQuickNote={handleQuickNote}
      />
  </div>
  </AuthGuard>
  )
}
