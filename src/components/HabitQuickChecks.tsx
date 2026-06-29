"use client"

import { useState, useEffect } from "react"
import Checkbox from "@/components/Checkbox"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { HABITS, todayKey } from "@/lib/utils"

// ================================================================
// 💪 Habit Quick-Checks
// ================================================================

export default function HabitQuickChecks() {
  const [data, setData] = useState<Record<string, string[]>>({})
  const [loaded, setLoaded] = useState(false)
  const today = todayKey()

  useEffect(() => {
    supabase
      .from("habits")
      .select("date_key, habit_id")
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("[HabitQuickChecks] load:", error.message)
          setLoaded(true)
          return
        }
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
        .then(({ error }) => { if (error) console.error("[HabitQuickChecks] delete:", error.message) })
    } else {
      supabase.from("habits").insert({ date_key: key, habit_id: id })
        .then(({ error }) => { if (error) console.error("[HabitQuickChecks] insert:", error.message) })
    }
  }

  if (!loaded) return <Skeleton className="h-52" />

  return (
    <MiniCard title="Today's Habits">
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {HABITS.map((h) => (
          <label
            key={h.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-bg-glass"
          >
            <Checkbox checked={doneToday.includes(h.id)} onChange={() => toggle(h.id)} />
            <span className="text-sm text-text-primary">{h.label}</span>
          </label>
        ))}
      </div>
    </MiniCard>
  )
}
