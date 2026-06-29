"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Checkbox from "@/components/Checkbox"

interface HabitData {
  [dateKey: string]: string[]
}

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

export default function HabitTracker() {
  const [data, setData] = useState<HabitData>({})
  const [loaded, setLoaded] = useState(false)

  const today = todayKey()
  const last7 = getDaysBack(7)

  // ── Load from Supabase on mount ──
  useEffect(() => {
    supabase
      .from("habits")
      .select("date_key, habit_id")
      .then(({ data: rows }) => {
        const map: HabitData = {}
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

  // ── Toggle habit: insert or delete row in Supabase ──
  async function toggleHabit(habitId: string) {
    const key = todayKey()

    // Optimistic UI update
    setData((prev) => {
      const done = prev[key] || []
      const exists = done.includes(habitId)
      return {
        ...prev,
        [key]: exists ? done.filter((id) => id !== habitId) : [...done, habitId],
      }
    })

    // Sync with Supabase
    const exists = (data[key] || []).includes(habitId)
    if (exists) {
      // Remove
      await supabase
        .from("habits")
        .delete()
        .eq("date_key", key)
        .eq("habit_id", habitId)
    } else {
      // Add
      await supabase.from("habits").insert({ date_key: key, habit_id: habitId })
    }
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
      <div className="glass-card-static p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Habit Tracker</h2>
        <div className="h-48 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 glass-card-static p-5 transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-secondary">Habit Tracker</h2>
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">{todayDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">{completedCount}/{totalCount}</span>
          <div
            className="relative h-10 w-10 rounded-full"
            style={{
              background: `conic-gradient(var(--color-accent) ${scorePct}%, var(--color-border) ${scorePct}%)`,
            }}
          >
            <div className="absolute inset-[2px] flex items-center justify-center rounded-full bg-bg-card">
              <span className="text-[10px] font-semibold text-text-primary">{Math.round(scorePct)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 text-[10px] text-text-secondary/60">
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
            <div key={habit.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bg-card-hover">
              <Checkbox
                checked={isDone(habit.id, today)}
                onChange={() => toggleHabit(habit.id)}
              />
              <span className="flex-1 text-sm text-text-primary">{habit.label}</span>
              <div className="flex items-center gap-[3px]">
                {last7.map((key) => (
                  <div
                    key={key}
                    className={`h-2.5 w-2.5 rounded-full ${
                      isDone(habit.id, key) ? "bg-accent" : "bg-bg-card-hover"
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

      <p className="mt-3 text-center text-[10px] text-text-secondary/60">
        Check off habits for today. Circles show last 7 days.
      </p>
    </div>
  )
}
