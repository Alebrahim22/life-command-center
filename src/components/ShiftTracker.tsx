"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface ShiftRecord {
  id: string
  date: string
  type: "work" | "sick" | "excused" | "allowance"
  allowance_hours: number
}

const YEAR_TARGET = 128
const ALLOWANCE_MAX_HOURS = 12
const ALLOWANCE_MAX_MONTHLY = 4
const SICK_MAX_DAYS = 15
const EXCUSED_MAX_DAYS = 4

function now() {
  return new Date().toISOString().split("T")[0]
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function currentYear(): number {
  return new Date().getFullYear()
}

export default function ShiftTracker() {
  const [records, setRecords] = useState<ShiftRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [allowanceInput, setAllowanceInput] = useState("")
  const [showAllowanceInput, setShowAllowanceInput] = useState(false)

  useEffect(() => {
    fetchShifts()
  }, [])

  async function fetchShifts() {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      console.error("Failed to fetch shifts:", error)
    } else if (data) {
      setRecords(
        data.map((row: any) => ({
          id: row.id,
          date: row.date,
          type: row.type,
          allowance_hours: row.allowance_hours ?? 0,
        })),
      )
    }
    setLoading(false)
  }

  const year = currentYear()
  const month = currentMonth()

  const shiftsThisMonth = records.filter(
    (r) => r.type === "work" && r.date.startsWith(month),
  ).length

  const shiftsThisYear = records.filter(
    (r) => r.type === "work" && r.date.startsWith(String(year)),
  ).length

  const allowanceHoursUsed = records
    .filter((r) => r.type === "allowance" && r.date.startsWith(String(year)))
    .reduce((sum, r) => sum + r.allowance_hours, 0)

  const allowanceThisMonth = records
    .filter((r) => r.type === "allowance" && r.date.startsWith(month))
    .reduce((sum, r) => sum + r.allowance_hours, 0)

  const sickUsed = records.filter(
    (r) => r.type === "sick" && r.date.startsWith(String(year)),
  ).length

  const excusedUsed = records.filter(
    (r) => r.type === "excused" && r.date.startsWith(String(year)),
  ).length

  const remaining = Math.max(0, YEAR_TARGET - shiftsThisYear)
  const progress = Math.min(100, (shiftsThisYear / YEAR_TARGET) * 100)
  const sickRemaining = Math.max(0, SICK_MAX_DAYS - sickUsed)
  const excusedRemaining = Math.max(0, EXCUSED_MAX_DAYS - excusedUsed)
  const allowanceRemaining = Math.max(0, ALLOWANCE_MAX_HOURS - allowanceHoursUsed)

  async function addShift(type: "work" | "sick" | "excused") {
    const { data, error } = await supabase
      .from("shifts")
      .insert({ type, date: now() })
      .select()
      .single()

    if (error) {
      console.error("Failed to add shift:", error)
      return
    }

    setRecords((prev) => [
      ...prev,
      { id: data.id, date: data.date, type: data.type, allowance_hours: data.allowance_hours ?? 0 },
    ])
  }

  async function addAllowance() {
    const hours = parseInt(allowanceInput, 10)
    if (isNaN(hours) || hours < 1) return

    if (allowanceThisMonth + hours > ALLOWANCE_MAX_MONTHLY) {
      alert(`Max ${ALLOWANCE_MAX_MONTHLY}h/month allowance. ${ALLOWANCE_MAX_MONTHLY - allowanceThisMonth}h remaining this month.`)
      return
    }

    if (allowanceHoursUsed + hours > ALLOWANCE_MAX_HOURS) {
      alert(`Max ${ALLOWANCE_MAX_HOURS}h/year allowance exceeded.`)
      return
    }

    const { data, error } = await supabase
      .from("shifts")
      .insert({ type: "allowance", date: now(), allowance_hours: hours })
      .select()
      .single()

    if (error) {
      console.error("Failed to add allowance:", error)
      return
    }

    setRecords((prev) => [
      ...prev,
      { id: data.id, date: data.date, type: data.type, allowance_hours: data.allowance_hours ?? 0 },
    ])
    setAllowanceInput("")
    setShowAllowanceInput(false)
  }

  if (loading) {
    return (
      <div className="glass-card-static p-5">
          <h2 className="mb-3 text-lg font-semibold text-text-secondary">Shift Tracker</h2>
          <div className="h-32 animate-pulse rounded bg-border" />
        </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 glass-card-static p-5 transition-all duration-300">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Shift Tracker</h2>

      <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">This Month</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{shiftsThisMonth}</p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">This Year</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{shiftsThisYear}</p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-accent">{remaining}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-medium tracking-wider uppercase text-text-muted">
          <span>Progress to {YEAR_TARGET}</span>
          <span>{shiftsThisYear}/{YEAR_TARGET}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-5 space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-medium tracking-wider uppercase text-text-muted">Leave Balances</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-bg-card-hover px-3 py-2">
            <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Allowance Leave</span>
            <span className="font-medium text-text-primary">{allowanceRemaining}h / {ALLOWANCE_MAX_HOURS}h</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-bg-card-hover px-3 py-2">
            <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Sick Leave</span>
            <span className="font-medium text-text-primary">{sickRemaining} / {SICK_MAX_DAYS} days</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-bg-card-hover px-3 py-2">
            <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Excused Absence</span>
            <span className="font-medium text-text-primary">{excusedRemaining} / {EXCUSED_MAX_DAYS} days</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          onClick={() => addShift("work")}
          className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
        >
          + Shift Completed
        </button>
        <button
          onClick={() => addShift("sick")}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-amber-500/30"
        >
          + Sick Day
        </button>
        <button
          onClick={() => addShift("excused")}
          className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/30"
        >
          + Excused Day
        </button>
        <button
          onClick={() => setShowAllowanceInput(!showAllowanceInput)}
          className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
        >
          + Allowance Hours
        </button>
      </div>

      {showAllowanceInput && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="4"
            placeholder="Hours (1-4)"
            value={allowanceInput}
            onChange={(e) => setAllowanceInput(e.target.value)}
            className="w-32 rounded-lg border border-border bg-bg-card-hover px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent"
          />
          <button
            onClick={addAllowance}
            className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
