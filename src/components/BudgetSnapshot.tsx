"use client"

import { useState, useEffect } from "react"

interface BudgetData {
  monthKey: string
  income: number
  savingsGoalPercent: number
  categories: Record<string, number>
}

const STORAGE_KEY = "budget-data"
const CATEGORIES = ["Housing", "Food", "Transport", "Subscriptions", "Business Expenses", "Personal", "Other"]

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

function load(): BudgetData {
  if (typeof window === "undefined") return defaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.monthKey !== currentMonthKey()) return defaultData()
      return {
        monthKey: parsed.monthKey,
        income: parsed.income ?? 0,
        savingsGoalPercent: parsed.savingsGoalPercent ?? 20,
        categories: { ...defaultData().categories, ...parsed.categories },
      }
    }
  } catch {}
  return defaultData()
}

export default function BudgetSnapshot() {
  const [data, setData] = useState<BudgetData>(defaultData())
  const [loaded, setLoaded] = useState(false)
  const [incomeInput, setIncomeInput] = useState("")
  const [goalInput, setGoalInput] = useState("20")
  const [editCat, setEditCat] = useState<string | null>(null)
  const [catInput, setCatInput] = useState("")

  useEffect(() => {
    const d = load()
    setData(d)
    setIncomeInput(String(d.income || ""))
    setGoalInput(String(d.savingsGoalPercent))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  function updateIncome() {
    const v = parseFloat(incomeInput)
    if (!isNaN(v) && v >= 0) setData((prev) => ({ ...prev, income: v }))
  }

  function updateGoal() {
    const v = parseInt(goalInput, 10)
    if (!isNaN(v) && v >= 0 && v <= 100) setData((prev) => ({ ...prev, savingsGoalPercent: v }))
  }

  function updateCategory(cat: string) {
    const v = parseFloat(catInput)
    if (!isNaN(v) && v >= 0) {
      setData((prev) => ({
        ...prev,
        categories: { ...prev.categories, [cat]: v },
      }))
    }
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
    green: "text-[#22c55e]",
    amber: "text-amber-400",
    red: "text-red-400",
  }

  const statusBg = {
    green: "bg-[#22c55e]",
    amber: "bg-amber-400",
    red: "bg-red-400",
  }

  const progressColor = totalSpent > available ? "bg-red-400" : totalSpent > available * 0.9 ? "bg-amber-400" : "bg-[#22c55e]"

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Budget Snapshot</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#a0a0a0]">Budget Snapshot</h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#666]">Monthly Income (KWD)</label>
          <input
            type="number"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
            onBlur={updateIncome}
            onKeyDown={(e) => e.key === "Enter" && updateIncome()}
            className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#222] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#666]">Savings Goal (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={updateGoal}
            onKeyDown={(e) => e.key === "Enter" && updateGoal()}
            className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#222] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[10px] text-[#a0a0a0]">Income</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {data.income.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[10px] text-[#a0a0a0]">Spent</p>
          <p className={`mt-1 text-lg font-semibold ${statusColor[status]}`}>
            {totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[10px] text-[#a0a0a0]">Remaining</p>
          <p className={`mt-1 text-lg font-semibold ${statusColor[status]}`}>
            {remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
          <span>Spending vs Available ({data.savingsGoalPercent}% savings)</span>
          <span>{totalSpent.toFixed(0)} / {available.toFixed(0)} KWD</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, spendPercent)}%` }}
          />
        </div>
      </div>

      <div className="mb-3 border-t border-[#2a2a2a] pt-3">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">
          Spending by Category
        </h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[#222]">
                <span className="text-sm text-[#c0c0c0]">{cat}</span>
                {editCat === cat ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={catInput}
                      onChange={(e) => setCatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && updateCategory(cat)}
                      className="w-24 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-right text-sm text-white outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => updateCategory(cat)}
                      className="rounded bg-[#22c55e] bg-opacity-20 px-2 py-1 text-xs font-medium text-[#22c55e]"
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
                    className="text-sm text-white hover:text-[#22c55e]"
                  >
                    {(data.categories[cat] || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
                  </button>
                )}
              </div>
              {data.income > 0 && (
                <div className="mx-3 mb-1 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-[#2a2a2a]">
                  <div
                    className="h-full rounded-full bg-[#22c55e]"
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

      <div className="rounded-lg border border-[#2a2a2a] bg-[#222] p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">Savings ({data.savingsGoalPercent}%)</span>
          <span className="font-medium text-white">
            {savingsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={`font-medium ${statusColor[status]}`}>
            {status === "green" ? "On Track" : status === "amber" ? "Near Limit" : "Over Budget"}
          </span>
          <span className="text-[#666]">
            {totalSpent > 0
              ? `${((totalSpent / data.income) * 100).toFixed(1)}% of income`
              : "No spending yet"}
          </span>
        </div>
      </div>
    </div>
  )
}
