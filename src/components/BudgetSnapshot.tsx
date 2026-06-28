"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface BudgetData {
  monthKey: string
  income: number
  savingsGoalPercent: number
  categories: Record<string, number>
}

const CATEGORIES = ["Housing", "Food", "Transport", "Subscriptions", "Business Expenses", "Personal", "Other"]

const CATEGORY_COLUMNS: Record<string, string> = {
  Housing: "housing",
  Food: "food",
  Transport: "transport",
  Subscriptions: "subscriptions",
  "Business Expenses": "business_expenses",
  Personal: "personal",
  Other: "other",
}

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function defaultData(): BudgetData {
  return {
    monthKey: currentMonthKey(),
    income: 0,
    savingsGoalPercent: 20,
    categories: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
  }
}

export default function BudgetSnapshot() {
  const [data, setData] = useState<BudgetData>(defaultData())
  const [loading, setLoading] = useState(true)
  const [incomeInput, setIncomeInput] = useState("")
  const [goalInput, setGoalInput] = useState("20")
  const [editCat, setEditCat] = useState<string | null>(null)
  const [catInput, setCatInput] = useState("")

  useEffect(() => {
    fetchBudget()
  }, [])

  async function fetchBudget() {
    const monthKey = currentMonthKey()
    const { data: row } = await supabase
      .from("budget")
      .select("*")
      .eq("month_key", monthKey)
      .maybeSingle()

    if (row) {
      const d: BudgetData = {
        monthKey,
        income: Number(row.income),
        savingsGoalPercent: row.savings_goal_percent,
        categories: {
          Housing: Number(row.housing),
          Food: Number(row.food),
          Transport: Number(row.transport),
          Subscriptions: Number(row.subscriptions),
          "Business Expenses": Number(row.business_expenses),
          Personal: Number(row.personal),
          Other: Number(row.other),
        },
      }
      setData(d)
      setIncomeInput(String(d.income || ""))
      setGoalInput(String(d.savingsGoalPercent))
    } else {
      const d = defaultData()
      setData(d)
      setIncomeInput("")
      setGoalInput("20")
    }

    setLoading(false)
  }

  async function upsertBudget(partial: Partial<{
    income: number
    savings_goal_percent: number
    housing: number
    food: number
    transport: number
    subscriptions: number
    business_expenses: number
    personal: number
    other: number
  }>) {
    const monthKey = currentMonthKey()
    const { error } = await supabase.from("budget").upsert(
      { month_key: monthKey, ...partial },
      { onConflict: "month_key" },
    )
    if (error) console.error("Failed to save budget:", error)
  }

  async function updateIncome() {
    const v = parseFloat(incomeInput)
    if (isNaN(v) || v < 0) return
    setData((prev) => ({ ...prev, income: v }))
    await upsertBudget({ income: v })
  }

  async function updateGoal() {
    const v = parseInt(goalInput, 10)
    if (isNaN(v) || v < 0 || v > 100) return
    setData((prev) => ({ ...prev, savingsGoalPercent: v }))
    await upsertBudget({ savings_goal_percent: v })
  }

  async function updateCategory(cat: string) {
    const v = parseFloat(catInput)
    if (isNaN(v) || v < 0) {
      setEditCat(null)
      setCatInput("")
      return
    }

    setData((prev) => ({
      ...prev,
      categories: { ...prev.categories, [cat]: v },
    }))

    const col = CATEGORY_COLUMNS[cat]
    if (col) await upsertBudget({ [col]: v })

    setEditCat(null)
    setCatInput("")
  }

  const totalSpent = Object.values(data.categories).reduce((a, b) => a + b, 0)
  const savingsAmount = data.income * (data.savingsGoalPercent / 100)
  const available = data.income - savingsAmount
  const remaining = available - totalSpent
  const spendPercent = available > 0 ? (totalSpent / available) * 100 : 0

  let status: "green" | "amber" | "red" = "green"
  if (totalSpent > available) {
    status = totalSpent <= available * 1.1 ? "amber" : "red"
  }

  const statusColor = {
    green: "text-accent",
    amber: "text-amber-400",
    red: "text-red-400",
  }

  const progressColor = totalSpent > available ? "bg-red-400" : totalSpent > available * 0.9 ? "bg-amber-400" : "bg-accent"

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Budget Snapshot</h2>
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Budget Snapshot</h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-text-secondary">Monthly Income (KWD)</label>
          <input
            type="number"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
            onBlur={updateIncome}
            onKeyDown={(e) => e.key === "Enter" && updateIncome()}
            className="mt-1 w-full rounded-lg border border-border bg-bg-card-hover px-3 py-2 text-sm text-text-primary outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-secondary">Savings Goal (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={updateGoal}
            onKeyDown={(e) => e.key === "Enter" && updateGoal()}
            className="mt-1 w-full rounded-lg border border-border bg-bg-card-hover px-3 py-2 text-sm text-text-primary outline-none"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Income</p>
          <p className="mt-1 text-lg font-semibold text-text-primary">
            {data.income.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Spent</p>
          <p className={`mt-1 text-lg font-semibold ${statusColor[status]}`}>
            {totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Remaining</p>
          <p className={`mt-1 text-lg font-semibold ${statusColor[status]}`}>
            {remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Spending vs Available ({data.savingsGoalPercent}% savings)</span>
          <span>{totalSpent.toFixed(0)} / {available.toFixed(0)} KWD</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, spendPercent)}%` }}
          />
        </div>
      </div>

      <div className="mb-3 border-t border-border pt-3">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
          Spending by Category
        </h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-bg-card-hover">
                <span className="text-sm text-text-secondary">{cat}</span>
                {editCat === cat ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={catInput}
                      onChange={(e) => setCatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && updateCategory(cat)}
                      className="w-24 rounded border border-border bg-bg-card px-2 py-1 text-right text-sm text-text-primary outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => updateCategory(cat)}
                      className="rounded bg-accent/20 px-2 py-1 text-xs font-medium text-accent"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditCat(cat)
                      setCatInput(String(data.categories[cat] || ""))
                    }}
                    className="text-sm text-text-primary hover:text-accent"
                  >
                    {(data.categories[cat] || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
                  </button>
                )}
              </div>
              {data.income > 0 && (
                <div className="mx-3 mb-1 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(100, ((data.categories[cat] || 0) / available) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card-hover p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Savings ({data.savingsGoalPercent}%)</span>
          <span className="font-medium text-text-primary">
            {savingsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={`font-medium ${statusColor[status]}`}>
            {status === "green" ? "On Track" : status === "amber" ? "Near Limit" : "Over Budget"}
          </span>
          <span className="text-text-secondary">
            {totalSpent > 0
              ? `${((totalSpent / data.income) * 100).toFixed(1)}% of income`
              : "No spending yet"}
          </span>
        </div>
      </div>
    </div>
  )
}
