"use client"

import { useState, useEffect, Suspense } from "react"
import SummaryCard from "@/components/SummaryCard"
import HabitQuickChecks from "@/components/HabitQuickChecks"
import TopTasks from "@/components/TopTasks"
import ActiveMilestones from "@/components/ActiveMilestones"
import UpcomingBills from "@/components/UpcomingBills"
import { ShiftTracker, PortfolioTracker, LegalCases } from "@/components/lazy-widgets"
import WidgetSkeleton from "@/components/WidgetSkeleton"
import { supabase } from "@/lib/supabase"
import { PROJECT_NAMES } from "@/lib/utils"

// ================================================================
// 🌟 Overview Desk — Life at a Glance
// ================================================================

export default function OverviewDesk() {
  const [openCard, setOpenCard] = useState<string | null>(null)

  // Quick data fetches for summaries
  const [habitCount, setHabitCount] = useState(0)
  const [todoCount, setTodoCount] = useState(0)
  const [billsDue, setBillsDue] = useState(0)
  const [portfolioVal, setPortfolioVal] = useState<string>("—")
  const [legalCount, setLegalCount] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    // Habits from Supabase
    const today = new Date().toISOString().split('T')[0]
    supabase.from('habits').select('habit_id').eq('date_key', today)
      .then(({ data }) => {
        if (data) setHabitCount(data.length)
      })

    // Todos count from Supabase
    supabase.from('todos').select('id', { count: 'exact', head: true }).eq('completed', false)
      .then(({ count }) => { if (count !== null) setTodoCount(count) })

    // Bills due count
    const todayDay = new Date().getDate()
    supabase.from('bills').select('*').then(({ data }) => {
      if (data) {
        const due = data.filter((b: any) => b.due_day >= todayDay && b.due_day <= todayDay + 7)
        setBillsDue(due.length)
      }
    })

    // Portfolio total from Supabase
    supabase.from('portfolio_holdings').select('quantity, current_price')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const total = data.reduce((s: number, h: any) => s + Number(h.quantity) * Number(h.current_price), 0)
          setPortfolioVal(total.toLocaleString('en-US', { minimumFractionDigits: 3 }) + ' KD')
        } else {
          setPortfolioVal('0.000 KD')
        }
      })

    // Legal cases count
    supabase.from('legal_cases').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setLegalCount(count) })

    setDataLoaded(true)
  }, [])

  const toggleCard = (id: string) => {
    setOpenCard(prev => prev === id ? null : id)
  }

  const cardProps = (id: string) => ({
    id,
    isOpen: openCard === id,
    onToggle: toggleCard,
  })

  return (
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3 xl:gap-4">
      <SummaryCard
          {...cardProps("operations")}
          emoji="📅"
          title="Operations"
          summary={dataLoaded ? `Shift & leave management` : `Loading...`}
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <ShiftTracker />
          </Suspense>
        </SummaryCard>

      <SummaryCard
        {...cardProps("capital")}
        emoji="📈"
        title="Capital & Assets"
        summary={dataLoaded ? portfolioVal : `Loading...`}
      >
        <Suspense fallback={<WidgetSkeleton />}>
          <PortfolioTracker />
        </Suspense>
      </SummaryCard>

      <SummaryCard
        {...cardProps("rhythm")}
        emoji="✅"
        title="Daily Rhythm"
        summary={dataLoaded ? `${habitCount}/10 habits · ${todoCount} tasks remaining` : `Loading...`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <HabitQuickChecks />
          <TopTasks />
        </div>
      </SummaryCard>

      <SummaryCard
        {...cardProps("ventures")}
        emoji="💼"
        title="Ventures & Business"
        summary={dataLoaded ? `${PROJECT_NAMES.length} active ventures` : `Loading...`}
      >
        <ActiveMilestones />
      </SummaryCard>

      <SummaryCard
        {...cardProps("admin")}
        emoji="⚖️"
        title="Administration"
        summary={dataLoaded ? `${billsDue} bills due · ${legalCount} legal cases` : `Loading...`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UpcomingBills />
          <Suspense fallback={<WidgetSkeleton />}>
            <LegalCases />
          </Suspense>
        </div>
      </SummaryCard>
    </div>
  )
}
