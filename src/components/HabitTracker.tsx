"use client"

import { useState, useEffect } from "react"

interface HabitData {
  [dateKey: string]: string[]
}

const STORAGE_KEY = "habit-data"

interface HabitDef {
  id: string
  label: string
}

const HABITS: HabitDef[] = [
  { id: "fajr", label: "Fajr Prayer" },
  { id: "dhuhr", label: "Dhuhr Prayer" },
  { id: "asr", label: "Asr Prayer" },
  { id: "maghrib", label: "Maghrib Prayer" },
  { id: "isha", label: "Isha Prayer" },
  { id: "morning-routine", label: "Morning Routine" },
  { id: "exercise", label: "Exercise" },
  { id: "read", label: "Read" },
  { id: "no-junk-food", label: "No Junk Food" },
  { id: "cold-shower", label: "Cold Shower" },
]

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

function getDaysBack(n: number): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

function load(): HabitData {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

export default function HabitTracker() {
  const [data, setData] = useState<HabitData>({})
  const [loaded, setLoaded] = useState(false)

  const today = todayKey()
  const last7 = getDaysBack(7)

  useEffect(() => {
    setData(load())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  function toggleHabit(habitId: string) {
    setData((prev) => {
      const todayDone = prev[today] || []
      const exists = todayDone.includes(habitId)
      const updated = exists
        ? todayDone.filter((id) => id !== habitId)
        : [...todayDone, habitId]
      return { ...prev, [today]: updated }
    })
  }

  function isDone(habitId: string, dateKey: string): boolean {
    return (data[dateKey] || []).includes(habitId)
  }

  function calcStreak(habitId: string): number {
    let streak = 0
    const now = new Date()
    for (let i = 0; ; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = formatDate(d)
      if (isDone(habitId, key)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  function dayLabel(dateKey: string): string {
    const d = new Date(dateKey + "T12:00:00")
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[d.getDay()]
  }

  const todayHabits = data[today] || []
  const completedCount = HABITS.filter((h) => todayHabits.includes(h.id)).length
  const totalCount = HABITS.length
  const scorePct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const now = new Date()
  const todayDisplay = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Habit Tracker</h2>
        <div className="h-48 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#a0a0a0]">Habit Tracker</h2>
          <p className="text-xs text-[#666]">{todayDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#a0a0a0]">{completedCount}/{totalCount}</span>
          <div
            className="relative h-10 w-10 rounded-full"
            style={{
              background: `conic-gradient(#22c55e ${scorePct}%, #2a2a2a ${scorePct}%)`,
            }}
          >
            <div className="absolute inset-[2px] flex items-center justify-center rounded-full bg-[#1a1a1a]">
              <span className="text-[10px] font-semibold text-white">{Math.round(scorePct)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 text-[10px] text-[#555]">
        {last7.map((key) => (
          <div key={key} className="flex w-8 flex-col items-center">
            <span>{dayLabel(key)}</span>
          </div>
        ))}
        <span className="ml-2 flex-1" />
        <span>Streak</span>
      </div>

      <div className="space-y-1">
        {HABITS.map((habit) => {
          const streak = calcStreak(habit.id)
          return (
            <div key={habit.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[#222]">
              <input
                type="checkbox"
                checked={isDone(habit.id, today)}
                onChange={() => toggleHabit(habit.id)}
                className="h-4 w-4 cursor-pointer accent-[#22c55e]"
              />
              <span className="flex-1 text-sm text-[#e0e0e0]">{habit.label}</span>
              <div className="flex items-center gap-[3px]">
                {last7.map((key) => (
                  <div
                    key={key}
                    className={`h-2.5 w-2.5 rounded-full ${
                      isDone(habit.id, key) ? "bg-[#22c55e]" : "bg-[#333]"
                    }`}
                  />
                ))}
              </div>
              <div className="ml-3 flex items-center gap-1">
                <span className="text-xs font-medium text-amber-400">{streak}</span>
                <span className="text-xs">🔥</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-center text-[10px] text-[#555]">
        Check off habits for today. Circles show last 7 days.
      </p>
    </div>
  )
}
