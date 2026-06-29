"use client"

import { useState, useEffect } from "react"
import { Bell, Coins } from "lucide-react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { Bill, formatCurrency } from "@/lib/utils"

// ================================================================
// 📋 Upcoming Bills
// ================================================================

export default function UpcomingBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().getDate()
    supabase.from("bills").select("*").order("due_day", { ascending: true }).then(({ data }) => {
      if (data) {
        const mapped = data.map((r: any) => {
          const inKwd = r.currency === "KWD" ? Number(r.amount) : Number(r.amount) * 0.307
          let status: Bill["status"] = "normal"
          if (r.due_day < today) status = "overdue"
          else if (r.due_day <= today + 7) status = "due-soon"
          return { id: r.id, name: r.name, amount: Number(r.amount), currency: r.currency, dueDay: r.due_day, category: r.category, inKwd, status }
        })
        setBills(mapped.filter((b) => b.status !== "normal"))
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-32" />

  return (
    <MiniCard title="Upcoming Bills">
      {bills.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Coins className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No upcoming bills due</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {bills.slice(0, 5).map((b) => (
            <div key={b.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-bg-card">
              <Bell className={`h-3.5 w-3.5 shrink-0 ${b.status === "overdue" ? "text-red-400" : "text-amber-400"}`} />
              <span className="flex-1 truncate text-sm text-text-primary">{b.name}</span>
              <span className="shrink-0 text-sm font-mono text-text-secondary">{formatCurrency(b.amount)} {b.currency}</span>
              <span className={`shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-md ${
                b.status === "overdue"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
                Day {b.dueDay}
              </span>
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}
