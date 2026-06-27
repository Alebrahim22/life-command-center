"use client"

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

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 ${className}`}>{children}</div>
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("today")

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <HeaderStrip />
      <TabNav onTabChange={setActiveTab} />

      <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        {activeTab === "today" && (
          <>
            <Grid>
              <PrayerTimes />
              <WeatherWidget />
            </Grid>
            <Section>
              <HabitTracker />
            </Section>
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
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
              <div className="text-center">
                <p className="text-lg font-medium text-[#666]">Coming Soon</p>
                <p className="mt-1 text-sm text-[#444]">More modules are on the way.</p>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
