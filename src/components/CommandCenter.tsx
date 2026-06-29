"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import {
  ArrowUpRight, TrendingUp, Bell, X, Target, ShieldCheck,
  Zap, Coins, Sparkles, LayoutDashboard, Shield,
  BarChart3, Wallet, ChartCandlestick, ChevronDown, Command,
} from "lucide-react"
import Checkbox from "@/components/Checkbox"
import QuickActionFab from "@/components/QuickActionFab"
import CommandPalette from "@/components/CommandPalette"

// Lazy-loaded widgets (largest files — loaded on-demand per desk tab)
const PortfolioTracker = lazy(() => import("@/components/PortfolioTracker"))
const TradingJournal = lazy(() => import("@/components/TradingJournal"))
const ProjectsTracker = lazy(() => import("@/components/ProjectsTracker"))
const LegalCases = lazy(() => import("@/components/LegalCases"))
const OsoulArchitect = lazy(() => import("@/components/OsoulArchitect"))
const ShiftTracker = lazy(() => import("@/components/ShiftTracker"))
const TodoList = lazy(() => import("@/components/TodoList"))
const BillsTracker = lazy(() => import("@/components/BillsTracker"))
const BudgetSnapshot = lazy(() => import("@/components/BudgetSnapshot"))
const HabitTracker = lazy(() => import("@/components/HabitTracker"))

// ─── Suspense fallback for lazy widgets ───
function WidgetSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-white/[0.04] bg-bg-card p-5">
      <div className="skeleton-shimmer h-4 w-2/5" />
      <div className="skeleton-shimmer h-3 w-4/5" />
      <div className="skeleton-shimmer h-3 w-3/5" />
      <div className="skeleton-shimmer h-[1px] w-full" />
      <div className="skeleton-shimmer h-8 w-full" />
      <div className="skeleton-shimmer h-8 w-full" />
    </div>
  )
}
import { supabase } from "@/lib/supabase"

// ─── Types ───────────────────────────────────────────────────────

interface Todo {
  id: string
  text: string
  priority: "high" | "medium" | "low"
  dueDate: string | null
  completed: boolean
}

interface Bill {
  id: string
  name: string
  amount: number
  currency: "KWD" | "USD"
  dueDay: number
  category: string
  inKwd: number
  status: "overdue" | "due-soon" | "normal" | "paid"
}

interface MarketRadar {
  ticker: string
  name: string
  price: number
  fv: number | null
  margin: number
}

interface Milestone {
  projectName: string
  title: string
  dueDate: string
  done: boolean
}

interface WarrantyItem {
  id: string
  itemName: string
  provider: string
  purchaseDate: string
  expirationDate: string
  daysRemaining: number
  totalDays: number
}

type DeskId = "overview" | "financial" | "operating" | "vault"

const DESKS: { id: DeskId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "overview", label: "Overview", icon: Sparkles, desc: "Life at a glance" },
  { id: "financial", label: "Financial", icon: BarChart3, desc: "Portfolio, Osoul & Trades" },
  { id: "operating", label: "Operating", icon: LayoutDashboard, desc: "Shifts, Tasks & Projects" },
  { id: "vault", label: "The Vault", icon: Shield, desc: "Legal, Bills & Budget" },
]

const HABITS = [
  { id: "fajr", label: "Fajr" },
  { id: "dhuhr", label: "Dhuhr" },
  { id: "asr", label: "Asr" },
  { id: "maghrib", label: "Maghrib" },
  { id: "isha", label: "Isha" },
  { id: "morning-routine", label: "Morning" },
  { id: "exercise", label: "Exercise" },
  { id: "read", label: "Read" },
  { id: "no-junk-food", label: "No Junk" },
  { id: "cold-shower", label: "Cold Shower" },
]

const PROJECT_NAMES = ["Hadeya", "Reluxx", "Osoul", "XYZ Agency", "Personal Brand"]

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

function formatCurrency(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ================================================================
// 🃏 MiniCard — Glassmorphism
// ================================================================
function MiniCard({ title, children, className = "", accent }: { title: string; children: React.ReactNode; className?: string; accent?: "green" | "gold" }) {
  return (
    <div
      className={`${
        accent === "gold" ? "glow-gold" : accent === "green" ? "glow-green" : ""
      } glass-card p-4 sm:p-5 ${className}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        <span className={`inline-block h-[3px] w-[3px] rounded-full ${
          accent === "gold" ? "bg-accent-gold" : "bg-accent"
        }`} />
        {title}
      </h3>
      {children}
    </div>
  )
}

// ================================================================
// 💀 Skeleton — Shimmer
// ================================================================
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />
}

// ================================================================
// 💪 Habit Quick-Checks
// ================================================================
function HabitQuickChecks() {
  const [data, setData] = useState<Record<string, string[]>>({})
  const [loaded, setLoaded] = useState(false)
  const today = todayKey()

  useEffect(() => {
    supabase
      .from("habits")
      .select("date_key, habit_id")
      .then(({ data: rows }) => {
        const map: Record<string, string[]> = {}
        if (rows) {
          for (const r of rows) {
            const key = r.date_key
            if (!map[key]) map[key] = []
            map[key].push(r.habit_id)
          }
        }
        setData(map)
        setLoaded(true)
      })
  }, [])

  const doneToday = data[today] || []

  function toggle(id: string) {
    const key = todayKey()
    const exists = doneToday.includes(id)

    // Optimistic UI
    setData((prev) => {
      const d = prev[today] || []
      return { ...prev, [today]: exists ? d.filter((x) => x !== id) : [...d, id] }
    })

    // Supabase sync
    if (exists) {
      supabase.from("habits").delete().eq("date_key", key).eq("habit_id", id)
    } else {
      supabase.from("habits").insert({ date_key: key, habit_id: id })
    }
  }

  if (!loaded) return <Skeleton className="h-52" />

  return (
    <MiniCard title="Today's Habits">
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {HABITS.map((h) => (
          <label
            key={h.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-white/[0.04]"
          >
            <Checkbox checked={doneToday.includes(h.id)} onChange={() => toggle(h.id)} />
            <span className="text-sm text-text-primary">{h.label}</span>
          </label>
        ))}
      </div>
    </MiniCard>
  )
}

// ================================================================
// 🎯 Top 5 Tasks
// ================================================================
function TopTasks() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("todos")
      .select("*")
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((r: any): Todo => ({
            id: r.id,
            text: r.text,
            priority: r.priority,
            dueDate: r.due_date,
            completed: r.completed,
          }))
          mapped.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
          setTodos(mapped.slice(0, 5))
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <Skeleton className="h-48" />

  return (
    <MiniCard title="Top Priorities">
      {todos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Zap className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">All clear — nothing urgent</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {todos.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <span
                className={`flex h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-bg-primary ${
                  t.priority === "high"
                    ? "bg-red-400 ring-red-400/20"
                    : t.priority === "medium"
                    ? "bg-amber-400 ring-amber-400/20"
                    : "bg-text-muted ring-white/5"
                }`}
              />
              <span className="flex-1 truncate text-sm text-text-primary">{t.text}</span>
              {t.dueDate && (
                <span className="shrink-0 text-[11px] font-mono text-text-muted">{t.dueDate}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}

// ================================================================
// 🏆 Active Milestones
// ================================================================
function ActiveMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      PROJECT_NAMES.map(async (name) => {
        const { data: proj } = await supabase.from("projects").select("id").eq("name", name).maybeSingle()
        if (!proj) return null
        const { data: ms } = await supabase
          .from("project_milestones")
          .select("title, due_date, done")
          .eq("project_id", proj.id)
          .eq("done", false)
          .order("due_date", { ascending: true })
          .limit(1)
        if (!ms || ms.length === 0) return null
        return { projectName: name, title: ms[0].title, dueDate: ms[0].due_date, done: ms[0].done }
      }),
    ).then((results) => {
      setMilestones(results.filter((r): r is Milestone => r !== null))
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-48" />

  return (
    <MiniCard title="Next Milestones">
      {milestones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Target className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No active milestones</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {milestones.map((m) => (
            <div
              key={m.projectName}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <Target className="h-3.5 w-3.5 shrink-0 text-accent-gold/60" />
              <span className="flex-1 truncate text-sm text-text-primary">{m.title}</span>
              <span className="shrink-0 text-[11px] font-mono text-accent-gold/50">{m.projectName}</span>
              <span className="shrink-0 text-[11px] font-mono text-text-muted">{m.dueDate}</span>
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}

// ================================================================
// 💰 Cash Runway
// ================================================================
function CashRunway() {
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

// ================================================================
// 📋 Upcoming Bills
// ================================================================
function UpcomingBills() {
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
            <div key={b.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.03]">
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

// ================================================================
// 📈 High-Conviction Stocks (Value Watch)
// ================================================================
function ValueWatch() {
  const [stocks, setStocks] = useState<MarketRadar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("market_radar").select("ticker, name, price, fv").then(({ data }) => {
      if (data) {
        const withMargin = data
          .filter((r) => r.fv && Number(r.fv) > Number(r.price))
          .map((r) => ({
            ticker: r.ticker,
            name: r.name,
            price: Number(r.price),
            fv: Number(r.fv),
            margin: (Number(r.fv) - Number(r.price)) / Number(r.price),
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 3)
        setStocks(withMargin)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-32" />

  return (
    <MiniCard title="Value Watch" accent="green">
      {stocks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <TrendingUp className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No undervalued picks today</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {stocks.map((s) => (
            <div key={s.ticker} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.03]">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="text-sm font-semibold font-mono text-text-primary">{s.ticker}</span>
              <span className="flex-1 truncate text-sm text-text-secondary">{s.name}</span>
              <span className="text-sm font-mono text-text-secondary">{formatCurrency(s.price)}</span>
              <span className="flex items-center gap-0.5 text-[12px] font-semibold font-mono text-accent">
                {(s.margin * 100).toFixed(0)}% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}

// ================================================================
// 🛡️ Warranty Checker
// ================================================================
function WarrantyChecker() {
  const [items, setItems] = useState<WarrantyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("warranties").select("*").order("expiration_date", { ascending: true }).then(({ data }) => {
      if (data) {
        const now = new Date()
        const mapped = data.map((r: any) => {
          const exp = new Date(r.expiration_date + "T23:59:59")
          const pur = new Date(r.purchase_date + "T00:00:00")
          const daysRemaining = Math.max(0, daysBetween(now, exp))
          const totalDays = Math.max(1, daysBetween(pur, exp))
          return {
            id: r.id,
            itemName: r.item_name,
            provider: r.provider,
            purchaseDate: r.purchase_date,
            expirationDate: r.expiration_date,
            daysRemaining,
            totalDays,
          }
        })
        setItems(mapped)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-44" />

  return (
    <MiniCard title="Warranties & Service Agreements">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <ShieldCheck className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No warranties tracked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((w) => {
            const pct = w.totalDays > 0 ? ((w.totalDays - w.daysRemaining) / w.totalDays) * 100 : 0
            const critical = w.daysRemaining < 30
            const barColor = critical ? "bg-red-500" : w.daysRemaining < 90 ? "bg-amber-400" : "bg-accent"
            return (
              <div key={w.id} className="rounded-xl bg-white/[0.03] px-3.5 py-2.5 transition-all duration-200 hover:bg-white/[0.05]">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${critical ? "text-red-400" : "text-accent"}`} />
                    <span className="text-sm font-medium text-text-primary">{w.itemName}</span>
                  </div>
                  <span className={`text-xs font-mono font-medium ${critical ? "text-red-400" : "text-text-secondary"}`}>
                    {w.daysRemaining}d left
                  </span>
                </div>
                <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>{w.provider}</span>
                  <span>Expires {w.expirationDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MiniCard>
  )
}

// ================================================================
// 🃏 SummaryCard — Accordion Life Summary
// ================================================================
function SummaryCard({ id, emoji, title, summary, isOpen, onToggle, children }: {
  id: string
  emoji: string
  title: string
  summary: string
  isOpen: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`group border border-white/[0.06] bg-zinc-900/30 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:border-white/[0.12] ${
        isOpen ? 'ring-1 ring-accent/10 shadow-[0_0_30px_rgba(34,197,94,0.04)]' : ''
      }`}
    >
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{emoji}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">{title}</h3>
            {!isOpen && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[240px]">{summary}</p>}
          </div>
        </div>
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'bg-accent/10 rotate-180' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
        }`}>
          <ChevronDown className={`h-3.5 w-3.5 transition-all duration-200 ${
            isOpen ? 'text-accent' : 'text-zinc-400'
          }`} />
        </div>
      </button>
      {/* Grid-rows accordion: smooth height transition without max-h hack */}
      <div
        className={`grid transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] p-4 pt-3 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// 🌟 Overview Desk — Life at a Glance
// ================================================================
function OverviewDesk() {
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

// ================================================================
// 📐 Section & Grid wrappers
// ================================================================
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`animate-fade-slide-up ${className}`}>{children}</div>
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">{children}</div>
}

// ================================================================
// 📊 Desk: Financial
// ================================================================
function FinancialDesk() {
  return (
    <div className="space-y-4">
      <Section>
        <div className="glass-card-static inline-flex p-1">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] bg-accent text-white shadow-[0_2px_12px_rgba(34,197,94,0.2)]"
          >
            <Wallet className="h-4 w-4" />
            Tracker
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] text-text-secondary hover:text-text-primary"
          >
            <ChartCandlestick className="h-4 w-4" />
            Osoul
          </button>
        </div>
      </Section>
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
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <OsoulArchitect />
        </Suspense>
      </Section>
    </div>
  )
}

// ================================================================
// 🏭 Desk: Operating
// ================================================================
function OperatingDesk() {
  return (
    <div className="space-y-4">
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <ShiftTracker />
        </Suspense>
      </Section>
      <Grid>
        <Suspense fallback={<WidgetSkeleton />}>
          <TodoList />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <HabitTracker />
        </Suspense>
      </Grid>
      <Grid>
        <TopTasks />
        <ActiveMilestones />
      </Grid>
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <ProjectsTracker />
        </Suspense>
      </Section>
    </div>
  )
}

// ================================================================
// 🛡️ Desk: The Vault
// ================================================================
function VaultDesk() {
  return (
    <div className="space-y-4">
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <LegalCases />
        </Suspense>
      </Section>
      <Grid>
        <Suspense fallback={<WidgetSkeleton />}>
          <BillsTracker />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <BudgetSnapshot />
        </Suspense>
      </Grid>
      <Grid>
        <UpcomingBills />
        <WarrantyChecker />
      </Grid>
    </div>
  )
}

// ================================================================
// 🔔 Notification Panel — Bills & Tasks Alerts
// ================================================================
interface AlertItem {
  id: string
  severity: "critical" | "warning"
  title: string
  message: string
}

function NotificationBell() {
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

// ================================================================
// 💻 Desktop Layout — Tabbed Desk Bar
// ================================================================
function DesktopLayout({ activeDesk, setActiveDesk }: { activeDesk: DeskId; setActiveDesk: (d: DeskId) => void }) {

  const handleRegisterDevice = async () => {
    try {
      const { data, error } = await supabase.auth.registerPasskey()
      if (error) {
        alert(`Registration Sync Error: ${error.message}`)
      } else {
        alert("Success! This device's biometric signature is securely paired to your vault.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
      {/* Mohammed's Premium Header */}
      <div className="mb-5 flex items-center justify-between animate-fade-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-emerald-500 to-accent/80 shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-white/10">
              <span className="text-sm font-bold text-white">م</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-text-primary">
                <span className="text-text-muted/50 font-normal">Command</span> Center
              </h1>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent/60" />
                {DESKS.find((d) => d.id === activeDesk)?.desc ?? "Life at a glance"}
                <span className="text-text-muted/30 mx-0.5">•</span>
                <span className="text-text-muted/40 font-mono tabular-nums text-[10px]">
                  {DESKS.findIndex((d) => d.id === activeDesk) + 1}/4
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-text-muted/60 sm:inline-flex items-center gap-0.5">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
          <button
            onClick={handleRegisterDevice}
            className="btn-ghost text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Pair Device Passkey
          </button>
        </div>
      </div>

      {/* ─────────────── Desk Bar ─────────────── */}
      <div className="mb-5 animate-fade-slide-up">
        <div className="glass-card-static flex items-center gap-1 px-1.5 py-1.5 rounded-xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm">
          {DESKS.map((desk, idx) => {
            const active = activeDesk === desk.id
            const Icon = desk.icon
            return (
              <button
                key={desk.id}
                onClick={() => setActiveDesk(desk.id)}
                className={`relative flex flex-1 items-center justify-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  active
                    ? "text-white bg-accent/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
                }`}
              >
                <Icon className={`h-4 w-4 transition-all duration-300 ${
                  active ? "text-accent drop-shadow-[0_0_6px_rgba(34,197,94,0.3)]" : ""
                }`} />
                <span className="hidden sm:inline">{desk.label}</span>
                <span className="text-[10px] font-mono tabular-nums text-text-muted/40 hidden sm:inline">[{idx + 1}]</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-accent/60 via-accent to-accent/60 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─────────────── Desk Content ─────────────── */}
      <div className="animate-fade-slide-up" key={activeDesk}>
        {activeDesk === "overview" && <OverviewDesk />}
        {activeDesk === "financial" && <FinancialDesk />}
        {activeDesk === "operating" && <OperatingDesk />}
        {activeDesk === "vault" && <VaultDesk />}
      </div>
    </div>
  )
}

// ================================================================
// 📱 Mobile Layout — zero-scroll, sub-tabbed
// ================================================================
const MOBILE_DESKS: { key: DeskId; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Sparkles },
  { key: "financial", label: "Financial", icon: BarChart3 },
  { key: "operating", label: "Operating", icon: LayoutDashboard },
  { key: "vault", label: "Vault", icon: Shield },
]

function MobileLayout({ activeDesk, setActiveDesk }: { activeDesk: DeskId; setActiveDesk: (d: DeskId) => void }) {
  return (
    <div className="h-screen overflow-hidden flex flex-col justify-between md:hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {/* Mobile Header — single instance */}
        <div className="mb-4 flex items-center gap-3 animate-fade-slide-up">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-emerald-500 to-accent/80 shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-white/10">
            <span className="text-xs font-bold text-white">م</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text-primary">
              <span className="text-text-muted/50 font-normal">Command</span> Center
            </h1>
            <p className="text-[10px] text-text-muted flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-accent/60" />
              {DESKS.find((d) => d.id === activeDesk)?.desc ?? "Life at a glance"}
            </p>
          </div>
        </div>

        <div className="animate-fade-slide-up">
          {activeDesk === "overview" && (
            <div className="flex flex-col gap-3">
              <OverviewDesk />
            </div>
          )}
          {activeDesk === "financial" && (
            <div className="flex flex-col gap-3">
              <FinancialDesk />
            </div>
          )}
          {activeDesk === "operating" && (
            <div className="flex flex-col gap-3">
              <OperatingDesk />
            </div>
          )}
          {activeDesk === "vault" && (
            <div className="flex flex-col gap-3">
              <VaultDesk />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Desk Bar */}
      <div className="flex items-center justify-evenly border-t border-white/[0.06] bg-zinc-900/90 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-900/90 pb-safe">
        {MOBILE_DESKS.map((d) => {
          const active = activeDesk === d.key
          const Icon = d.icon
          return (
            <button
              key={d.key}
              onClick={() => setActiveDesk(d.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium tracking-wide transition-all duration-200 min-h-[44px] ${
                active ? "text-accent" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "drop-shadow-[0_0_4px_rgba(34,197,94,0.3)]" : ""}`} />
              {d.label}
              {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full shadow-[0_0_6px_rgba(34,197,94,0.3)]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
// 🚀 CommandCenter — Entry point
// ================================================================
export default function CommandCenter() {
  const [activeDesk, setActiveDesk] = useState<DeskId>("overview")
  const [paletteOpen, setPaletteOpen] = useState(false)

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      // Ctrl/Cmd+K → toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }

      // ? → open palette
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }

      // Escape → close palette
      if (e.key === "Escape") {
        setPaletteOpen(false)
        return
      }

      // 1-4 → navigate desks
      const deskMap: Record<string, DeskId> = {
        "1": "overview",
        "2": "financial",
        "3": "operating",
        "4": "vault",
      }
      if (e.key in deskMap) {
        setActiveDesk(deskMap[e.key])
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const fabHandlers = useCallback((desk: DeskId) => {
    setActiveDesk(desk)
  }, [])

  return (
    <>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(desk) => setActiveDesk(desk)}
      />
      <div className="hidden md:block">
        <DesktopLayout activeDesk={activeDesk} setActiveDesk={setActiveDesk} />
      </div>
      <MobileLayout activeDesk={activeDesk} setActiveDesk={setActiveDesk} />
      <QuickActionFab
        onAddTodo={() => fabHandlers("operating")}
        onLogShift={() => fabHandlers("operating")}
        onMarkHabits={() => fabHandlers("operating")}
        onQuickNote={() => fabHandlers("operating")}
      />
    </>
  )
}
