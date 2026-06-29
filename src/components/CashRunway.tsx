"use client"

import { useState, useEffect } from "react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

// ================================================================
// 💰 Cash Runway
// ================================================================

export default function CashRunway() {
  const [income, setIncome] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    supabase
      .from("budget")
      .select("*")
      .eq("month_key", monthKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const inc = Number(data.income)
          const spent = ["housing", "food", "transport", "subscriptions", "business_expenses", "personal", "other"]
            .reduce((s, c) => s + Number((data as any)[c] || 0), 0)
          const savingsAmt = inc * (data.savings_goal_percent / 100)
          const avail = inc - savingsAmt
          setIncome(inc)
          setTotalSpent(spent)
          setRemaining(avail - spent)
        }
        setLoading(false)
      })
  }, [])

  const spendPct = income > 0 ? (totalSpent / (income * 0.8)) * 100 : 0

  if (loading) return <Skeleton className="h-32" />

  return (
    <MiniCard title="Cash Runway">
      <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-white/[0.03] p-2.5 text-center">
          <p className="text-[11px] text-text-muted">Income</p>
          <p className="mt-0.5 font-semibold font-mono text-text-primary">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-2.5 text-center">
          <p className="text-[11px] text-text-muted">Spent</p>
          <p className="mt-0.5 font-semibold font-mono text-text-secondary">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-2.5 text-center">
          <p className="text-[11px] text-text-muted">Left</p>
          <p className={`mt-0.5 font-semibold font-mono ${remaining >= 0 ? "text-accent" : "text-red-400"}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-500"
          style={{ width: `${Math.min(100, spendPct)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-text-muted font-mono">
        {Math.round(spendPct)}% of monthly budget used
      </p>
    </MiniCard>
  )
}
