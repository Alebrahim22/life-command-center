"use client"

import { Suspense, useState } from "react"
import { Wallet, ChartCandlestick } from "lucide-react"
import Section from "@/components/Section"
import Grid from "@/components/Grid"
import ValueWatch from "@/components/ValueWatch"
import CashRunway from "@/components/CashRunway"
import { PortfolioTracker, TradingJournal, OsoulArchitect } from "@/components/lazy-widgets"
import WidgetSkeleton from "@/components/WidgetSkeleton"

// ================================================================
// 📊 Desk: Financial
// ================================================================

export default function FinancialDesk() {
  const [view, setView] = useState<"tracker" | "osoul">("tracker")

  return (
    <div className="space-y-4">
      <Section>
        <div className="glass-card-static inline-flex p-1">
          <button
            onClick={() => setView("tracker")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
              view === "tracker"
                ? "bg-accent text-white shadow-[0_2px_12px_rgba(34,197,94,0.2)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Tracker
          </button>
          <button
            onClick={() => setView("osoul")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
              view === "osoul"
                ? "bg-accent text-white shadow-[0_2px_12px_rgba(34,197,94,0.2)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <ChartCandlestick className="h-4 w-4" />
            Osoul
          </button>
        </div>
      </Section>

      {view === "tracker" ? (
        <>
          <Section>
            <Suspense fallback={<WidgetSkeleton />}>
              <PortfolioTracker />
            </Suspense>
          </Section>
          <Grid>
            <ValueWatch />
            <CashRunway />
          </Grid>
          <Section>
            <Suspense fallback={<WidgetSkeleton />}>
              <TradingJournal />
            </Suspense>
          </Section>
        </>
      ) : (
        <Section>
          <Suspense fallback={<WidgetSkeleton />}>
            <OsoulArchitect />
          </Suspense>
        </Section>
      )}
    </div>
  )
}
