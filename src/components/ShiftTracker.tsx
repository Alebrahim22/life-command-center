"use client"

import { useState, useEffect } from "react"

interface ShiftRecord {
  date: string
  type: "work" | "sick" | "excused"
}

interface ShiftData {
  records: ShiftRecord[]
  allowanceHoursUsed: number
}

const STORAGE_KEY = "shift-data"
const YEAR_TARGET = 128
const ALLOWANCE_MAX_HOURS = 12
const ALLOWANCE_MAX_MONTHLY = 4
const SICK_MAX_DAYS = 15
const EXCUSED_MAX_DAYS = 4

function now() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function currentYear(): number {
  return new Date().getFullYear()
}

function loadData(): ShiftData {
  if (typeof window === "undefined") return { records: [], allowanceHoursUsed: 0 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { records: [], allowanceHoursUsed: 0 }
}

function saveData(data: ShiftData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function ShiftTracker() {
  const [data, setData] = useState<ShiftData>({ records: [], allowanceHoursUsed: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setData(loadData())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveData(data)
  }, [data, loaded])

  const year = currentYear()
  const month = currentMonth()

  const shiftsThisMonth = data.records.filter(
    (r) => r.type === "work" && r.date.startsWith(month),
  ).length

  const shiftsThisYear = data.records.filter(
    (r) => r.type === "work" && r.date.startsWith(String(year)),
  ).length

  const remaining = Math.max(0, YEAR_TARGET - shiftsThisYear)
  const progress = Math.min(100, (shiftsThisYear / YEAR_TARGET) * 100)

  const sickUsed = data.records.filter(
    (r) => r.type === "sick" && r.date.startsWith(String(year)),
  ).length

  const excusedUsed = data.records.filter(
    (r) => r.type === "excused" && r.date.startsWith(String(year)),
  ).length

  const sickRemaining = Math.max(0, SICK_MAX_DAYS - sickUsed)
  const excusedRemaining = Math.max(0, EXCUSED_MAX_DAYS - excusedUsed)
  const allowanceRemaining = Math.max(0, ALLOWANCE_MAX_HOURS - data.allowanceHoursUsed)

  const allowanceUsedThisMonth = data.allowanceHoursUsed

  function addShift(type: "work" | "sick" | "excused") {
    setData((prev) => {
      const updated = { ...prev, records: [...prev.records, { date: now(), type }] }
      return updated
    })
  }

  const [allowanceInput, setAllowanceInput] = useState("")
  const [showAllowanceInput, setShowAllowanceInput] = useState(false)

  function addAllowance() {
    const hours = parseInt(allowanceInput, 10)
    if (isNaN(hours) || hours < 1) return

    const monthKey = currentMonth()
    const allowanceThisMonth = data.allowanceHoursUsed

    if (allowanceThisMonth + hours > ALLOWANCE_MAX_MONTHLY) {
      alert(`Max ${ALLOWANCE_MAX_MONTHLY}h/month allowance. ${ALLOWANCE_MAX_MONTHLY - allowanceThisMonth}h remaining this month.`)
      return
    }

    if (data.allowanceHoursUsed + hours > ALLOWANCE_MAX_HOURS) {
      alert(`Max ${ALLOWANCE_MAX_HOURS}h/year allowance exceeded.`)
      return
    }

    setData((prev) => ({
      ...prev,
      allowanceHoursUsed: prev.allowanceHoursUsed + hours,
      records: [...prev.records, { date: now(), type: "work" }],
    }))
    setAllowanceInput("")
    setShowAllowanceInput(false)
  }

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Shift Tracker</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#a0a0a0]">Shift Tracker</h2>

      <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[#a0a0a0]">This Month</p>
          <p className="mt-1 text-2xl font-semibold text-white">{shiftsThisMonth}</p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[#a0a0a0]">This Year</p>
          <p className="mt-1 text-2xl font-semibold text-white">{shiftsThisYear}</p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-[#a0a0a0]">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-[#22c55e]">{remaining}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
          <span>Progress to {YEAR_TARGET}</span>
          <span>{shiftsThisYear}/{YEAR_TARGET}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
          <div
            className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-5 space-y-2 border-t border-[#2a2a2a] pt-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Leave Balances</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-[#222] px-3 py-2">
            <span className="text-[#c0c0c0]">Allowance Leave</span>
            <span className="font-medium text-white">{allowanceRemaining}h / {ALLOWANCE_MAX_HOURS}h</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#222] px-3 py-2">
            <span className="text-[#c0c0c0]">Sick Leave</span>
            <span className="font-medium text-white">{sickRemaining} / {SICK_MAX_DAYS} days</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#222] px-3 py-2">
            <span className="text-[#c0c0c0]">Excused Absence</span>
            <span className="font-medium text-white">{excusedRemaining} / {EXCUSED_MAX_DAYS} days</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#2a2a2a] pt-4">
        <button
          onClick={() => addShift("work")}
          className="rounded-lg bg-[#22c55e] bg-opacity-20 px-4 py-2 text-sm font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
        >
          + Shift Completed
        </button>
        <button
          onClick={() => addShift("sick")}
          className="rounded-lg bg-[#f97316] bg-opacity-20 px-4 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-opacity-30"
        >
          + Sick Day
        </button>
        <button
          onClick={() => addShift("excused")}
          className="rounded-lg bg-[#a855f7] bg-opacity-20 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-opacity-30"
        >
          + Excused Day
        </button>
        <button
          onClick={() => setShowAllowanceInput(!showAllowanceInput)}
          className="rounded-lg bg-[#3b82f6] bg-opacity-20 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-opacity-30"
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
            className="w-32 rounded-lg border border-[#2a2a2a] bg-[#222] px-3 py-2 text-sm text-white placeholder-[#666] outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={addAllowance}
            className="rounded-lg bg-blue-400 bg-opacity-20 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-opacity-30"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
