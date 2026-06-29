"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AlertItem } from "@/lib/utils"

// ================================================================
// 🔔 Notification Panel — Bills & Tasks Alerts
// ================================================================

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    const today = new Date().getDate()
    const [billsRes, todosRes] = await Promise.all([
      supabase.from("bills").select("name, due_day, amount, currency"),
      supabase.from("todos").select("text, priority, due_date").eq("completed", false),
    ])

    const items: AlertItem[] = []

    // Overdue bills
    const bills = billsRes.data || []
    for (const b of bills) {
      if (b.due_day < today) {
        items.push({
          id: `bill-over-${b.name}`,
          severity: "critical",
          title: b.name,
          message: `Overdue (day ${b.due_day})`,
        })
      } else if (b.due_day <= today + 7) {
        items.push({
          id: `bill-soon-${b.name}`,
          severity: "warning",
          title: b.name,
          message: `Due in ${b.due_day - today} days`,
        })
      }
    }

    // High-priority tasks
    const todos = todosRes.data || []
    for (const t of todos) {
      if (t.priority === "high") {
        items.push({
          id: `task-${t.text}`,
          severity: "warning",
          title: t.text,
          message: t.due_date ? `Due ${t.due_date}` : "High priority",
        })
      }
    }

    // Medium priority with past due dates
    for (const t of todos) {
      if (t.priority === "medium" && t.due_date) {
        const due = new Date(t.due_date + "T23:59:59")
        const now = new Date()
        if (due <= now) {
          items.push({
            id: `task-over-${t.text}`,
            severity: "critical",
            title: t.text,
            message: `Overdue (${t.due_date})`,
          })
        }
      }
    }

    setAlerts(items)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost relative p-2.5"
        title="View alerts"
      >
        <Bell className="h-4 w-4" />
        {!loading && alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-scale-in rounded-xl border border-white/[0.06] bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Alerts {alerts.length > 0 && `(${alerts.length})`}
              </h3>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {!loading && alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <ShieldCheck className="h-6 w-6 text-accent/40" />
                  <p className="text-xs text-text-secondary">All clear — no alerts</p>
                </div>
              ) : (
                alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      a.severity === "critical"
                        ? "bg-red-500/5 border-l-2 border-red-500"
                        : "bg-amber-500/5 border-l-2 border-amber-500"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-sm">
                      {a.severity === "critical" ? "🔴" : "🟡"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{a.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
