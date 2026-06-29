"use client"

import { useState, useEffect } from "react"
import {
  ArrowUpRight, TrendingUp, Bell, Target, ShieldCheck, Sun, Cloud,
  Zap, Coins, Sparkles, LayoutDashboard, Briefcase, Shield,
  BarChart3, Wallet, ChartCandlestick,
} from "lucide-react"
import Checkbox from "@/components/Checkbox"
import ShiftTracker from "@/components/ShiftTracker"
import TodoList from "@/components/TodoList"
import PortfolioTracker from "@/components/PortfolioTracker"
import BillsTracker from "@/components/BillsTracker"
import BudgetSnapshot from "@/components/BudgetSnapshot"
import TradingJournal from "@/components/TradingJournal"
import ProjectsTracker from "@/components/ProjectsTracker"
import LegalCases from "@/components/LegalCases"
import HabitTracker from "@/components/HabitTracker"
import OsoulArchitect from "@/components/OsoulArchitect"
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

type DeskId = "financial" | "operating" | "vault"

const DESKS: { id: DeskId; label: string; icon: React.ElementType; desc: string }[] = [
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

const STORAGE_KEY = "habit-data"
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setData(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  const doneToday = data[today] || []

  function toggle(id: string) {
    setData((prev) => {
      const d = prev[today] || []
      const exists = d.includes(id)
      return { ...prev, [today]: exists ? d.filter((x) => x !== id) : [...d, id] }
    })
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
      <Section><PortfolioTracker /></Section>
      <Grid>
        <ValueWatch />
        <CashRunway />
      </Grid>
      <Section><TradingJournal /></Section>
      <Section><OsoulArchitect /></Section>
    </div>
  )
}

// ================================================================
// 🏭 Desk: Operating
// ================================================================
function OperatingDesk() {
  return (
    <div className="space-y-4">
      <Section><ShiftTracker /></Section>
      <Grid>
        <TodoList />
        <HabitTracker />
      </Grid>
      <Grid>
        <TopTasks />
        <ActiveMilestones />
      </Grid>
      <Section><ProjectsTracker /></Section>
    </div>
  )
}

// ================================================================
// 🛡️ Desk: The Vault
// ================================================================
function VaultDesk() {
  return (
    <div className="space-y-4">
      <Section><LegalCases /></Section>
      <Grid>
        <BillsTracker />
        <BudgetSnapshot />
      </Grid>
      <Grid>
        <UpcomingBills />
        <WarrantyChecker />
      </Grid>
    </div>
  )
}

// ================================================================
// 🖥️ Desktop Layout — Multi-Desk
// ================================================================
function DesktopLayout() {
  const [activeDesk, setActiveDesk] = useState<DeskId>("operating")

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
                Mohammed's <span className="text-accent">Command Center</span>
              </h1>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent/60" />
                Your daily operational overview
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRegisterDevice}
          className="btn-ghost text-xs"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Pair Device Passkey
        </button>
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
type MobileTab = "financial" | "operating" | "vault"

const MOBILE_DESKS: { key: MobileTab; label: string; icon: React.ElementType }[] = [
  { key: "financial", label: "Financial", icon: BarChart3 },
  { key: "operating", label: "Operating", icon: LayoutDashboard },
  { key: "vault", label: "Vault", icon: Shield },
]

function MobileLayout() {
  const [desk, setDesk] = useState<MobileTab>("operating")

  return (
    <div className="h-screen overflow-hidden flex flex-col justify-between md:hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <div className="animate-fade-slide-up">
          {desk === "financial" && (
            <div className="flex flex-col gap-3">
              <FinancialDesk />
            </div>
          )}
          {desk === "operating" && (
            <div className="flex flex-col gap-3">
              <OperatingDesk />
            </div>
          )}
          {desk === "vault" && (
            <div className="flex flex-col gap-3">
              <VaultDesk />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Desk Bar */}
      <div className="flex items-center justify-evenly border-t border-white/[0.06] bg-zinc-900/90 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-900/90 pb-safe">
        {MOBILE_DESKS.map((d) => {
          const active = desk === d.key
          const Icon = d.icon
          return (
            <button
              key={d.key}
              onClick={() => setDesk(d.key)}
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
  return (
    <>
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
      <MobileLayout />
    </>
  )
}
