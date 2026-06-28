"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import HeaderStrip from "@/components/HeaderStrip"
import TabNav from "@/components/TabNav"
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

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 ${className}`}>{children}</div>
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview")
  const [financeView, setFinanceView] = useState<"tracker" | "osoul">("tracker")

  return (
    <AuthGuard>
    <div className="min-h-screen bg-bg-primary">
      <HeaderStrip />
      <TabNav onTabChange={setActiveTab} />

      {activeTab === "overview" ? (
        <CommandCenter />
      ) : (
      <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        {activeTab === "today" && (
          <>
            <Grid>
              <PrayerTimes />
              <WeatherWidget />
            </Grid>
            <Grid>
              <HabitTracker />
              <NewsFeed />
            </Grid>
          </>
        )}

        {activeTab === "work" && (
          <>
            <Section>
              <ShiftTracker />
            </Section>
            <Grid>
              <TodoList />
              <UpcomingEvents />
            </Grid>
          </>
        )}

        {activeTab === "finance" && (
          <>
            <div className="mb-4 flex gap-1 rounded-lg border border-border bg-bg-card p-1 w-fit">
              <button
                onClick={() => setFinanceView("tracker")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                  financeView === "tracker"
                    ? "bg-accent/20 text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Multi-Platform Tracker
              </button>
              <button
                onClick={() => setFinanceView("osoul")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                  financeView === "osoul"
                    ? "bg-accent/20 text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Osoul Architect
              </button>
            </div>

            {financeView === "tracker" ? (
              <>
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
              </>
            ) : (
              <Section>
                <OsoulArchitect />
              </Section>
            )}
          </>
        )}

        {activeTab === "business" && (
          <>
            <Section>
              <ProjectsTracker />
            </Section>
            <Section>
              <LegalCases />
            </Section>
          </>
        )}

        {activeTab === "more" && (
          <Section>
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border bg-bg-card">
              <div className="text-center">
                <p className="text-lg font-medium text-text-secondary">Coming Soon</p>
                <p className="mt-1 text-sm text-text-secondary">More modules are on the way.</p>
              </div>
            </div>
          </Section>
        )}
      </div>
    )}
  </div>
  </AuthGuard>
  )
}
/* Build Revision: 1782619521 */
