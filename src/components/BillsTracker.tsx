"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"

interface Bill {
  id: string
  name: string
  amount: number
  currency: "KWD" | "USD"
  dueDay: number
  category: "Utility" | "Subscription" | "Insurance" | "Loan" | "Other"
  autoRenews: boolean
}

interface BillsData {
  usdToKwdRate: number
  bills: Bill[]
  paidByMonth: Record<string, string[]>
}

const STORAGE_KEY = "bills-data"
const CATEGORIES: Bill["category"][] = ["Utility", "Subscription", "Insurance", "Loan", "Other"]

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function currentDay(): number {
  return new Date().getDate()
}

function defaultData(): BillsData {
  return { usdToKwdRate: 0.307, bills: [], paidByMonth: {} }
}

function load(): BillsData {
  if (typeof window === "undefined") return defaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaultData()
}

export default function BillsTracker() {
  const [data, setData] = useState<BillsData>(defaultData())
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [rateInput, setRateInput] = useState("0.307")

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<"KWD" | "USD">("KWD")
  const [dueDay, setDueDay] = useState("1")
  const [category, setCategory] = useState<Bill["category"]>("Utility")
  const [autoRenews, setAutoRenews] = useState(true)

  useEffect(() => {
    const d = load()
    setData(d)
    setRateInput(String(d.usdToKwdRate))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  function updateRate() {
    const v = parseFloat(rateInput)
    if (v > 0) setData((prev) => ({ ...prev, usdToKwdRate: v }))
  }

  function addBill() {
    const amt = parseFloat(amount)
    const day = parseInt(dueDay, 10)
    if (!name.trim() || isNaN(amt) || isNaN(day) || day < 1 || day > 31) return
    const bill: Bill = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: name.trim(),
      amount: amt,
      currency,
      dueDay: day,
      category,
      autoRenews,
    }
    setData((prev) => ({ ...prev, bills: [...prev.bills, bill].sort((a, b) => a.dueDay - b.dueDay) }))
    setName("")
    setAmount("")
    setDueDay("1")
    setShowForm(false)
  }

  function deleteBill(id: string) {
    setData((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== id),
    }))
  }

  function togglePaid(billId: string) {
    setData((prev) => {
      const monthKey = currentMonthKey()
      const paid = prev.paidByMonth[monthKey] || []
      const exists = paid.includes(billId)
      return {
        ...prev,
        paidByMonth: {
          ...prev.paidByMonth,
          [monthKey]: exists ? paid.filter((id) => id !== billId) : [...paid, billId],
        },
      }
    })
  }

  const monthKey = currentMonthKey()
  const today = currentDay()
  const paidIds = data.paidByMonth[monthKey] || []

  let totalKwd = 0
  const billsWithStatus = data.bills.map((b) => {
    const inKwd = b.currency === "KWD" ? b.amount : b.amount * data.usdToKwdRate
    totalKwd += inKwd

    const isPaid = paidIds.includes(b.id)
    let status: "normal" | "due-soon" | "overdue" | "paid" = "normal"
    if (isPaid) {
      status = "paid"
    } else if (b.dueDay < today) {
      status = "overdue"
    } else if (b.dueDay <= today + 7) {
      status = "due-soon"
    }

    return { ...b, inKwd, status }
  })

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Bills & Subscriptions</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#a0a0a0]">Bills & Subscriptions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[#22c55e] bg-opacity-20 px-3 py-1.5 text-xs font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
        >
          {showForm ? "Cancel" : "+ Bill"}
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg bg-[#222] p-3">
        <span className="text-sm text-[#a0a0a0]">Monthly Total</span>
        <span className="text-lg font-semibold text-white">
          {totalKwd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KWD
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs text-[#a0a0a0]">1 USD =</label>
        <input
          type="number"
          step="0.001"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onBlur={updateRate}
          onKeyDown={(e) => e.key === "Enter" && updateRate()}
          className="w-20 rounded-lg border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white outline-none"
        />
        <span className="text-xs text-[#a0a0a0]">KWD</span>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-[#222] p-3">
          <input
            type="text"
            placeholder="Bill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#666] outline-none focus:border-[#22c55e]"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#666] outline-none"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "KWD" | "USD")}
              className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white outline-none"
            >
              <option value="KWD">KWD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-[#666]">Due Day (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-[#666]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Bill["category"])}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white outline-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#c0c0c0]">
            <input
              type="checkbox"
              checked={autoRenews}
              onChange={(e) => setAutoRenews(e.target.checked)}
              className="accent-[#22c55e]"
            />
            Auto-renews
          </label>
          <button
            onClick={addBill}
            className="w-full rounded-lg bg-[#22c55e] bg-opacity-20 py-2 text-sm font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
          >
            Add Bill
          </button>
        </div>
      )}

      {billsWithStatus.length === 0 && (
        <p className="py-6 text-center text-sm text-[#666]">No bills added yet</p>
      )}

      <div className="space-y-1">
        {billsWithStatus.map((b) => (
          <div
            key={b.id}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#222] ${
              b.status === "overdue"
                ? "border-l-2 border-red-500 bg-red-500 bg-opacity-5"
                : b.status === "due-soon"
                  ? "border-l-2 border-amber-500 bg-amber-500 bg-opacity-5"
                  : ""
            }`}
          >
            <button onClick={() => togglePaid(b.id)}>
              <CheckCircle2
                className={`h-4 w-4 ${
                  b.status === "paid" ? "text-[#22c55e]" : "text-[#555]"
                }`}
              />
            </button>
            <div className="flex-1">
              <p className={`text-sm ${b.status === "paid" ? "text-[#555] line-through" : "text-[#e0e0e0]"}`}>
                {b.name}
              </p>
              <p className="text-[10px] text-[#666]">
                Day {b.dueDay} · {b.category}{b.autoRenews ? " · Auto" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                b.status === "paid" ? "text-[#555]" : "text-white"
              }`}>
                {b.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {b.currency}
              </p>
              <p className="text-[10px] text-[#666]">
                ≈ {b.inKwd.toLocaleString("en-US", { minimumFractionDigits: 2 })} KWD
              </p>
            </div>
            <button
              onClick={() => deleteBill(b.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
