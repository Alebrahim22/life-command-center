"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchPrayerTimes, type PrayerTimesData } from "@/lib/prayer-times"

interface PrayerInfo {
  name: string
  time: string
  minutes: number
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function getStatus(
  prayers: PrayerInfo[],
  nowMinutes: number,
): { current: string | null; next: string | null } {
  let current: string | null = null
  let next: string | null = null

  for (let i = 0; i < prayers.length; i++) {
    if (nowMinutes >= prayers[i].minutes) {
      current = prayers[i].name
    }
    if (nowMinutes < prayers[i].minutes) {
      next = prayers[i].name
      break
    }
  }

  if (!next) {
    next = prayers[0].name
  }

  return { current, next }
}

const PRAYER_LABELS: Record<string, string> = {
  Fajr: "Fajr",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
}

export default function PrayerTimes() {
  const [data, setData] = useState<PrayerTimesData | null>(null)
  const [error, setError] = useState(false)
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    fetchPrayerTimes().then(setData).catch(() => setError(true))
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setNowMinutes(d.getHours() * 60 + d.getMinutes())
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const status = useCallback(() => {
    if (!data) return { current: null, next: null }
    const prayers = (Object.keys(PRAYER_LABELS) as (keyof typeof data.timings)[]).map((name) => ({
      name,
      time: data.timings[name],
      minutes: toMinutes(data.timings[name]),
    }))
    return getStatus(prayers, nowMinutes)
  }, [data, nowMinutes])

  const { current, next } = status()

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Prayer Times</h2>
        <p className="text-sm text-red-400">Failed to load prayer times</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Prayer Times</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-border" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Prayer Times</h2>
      <div className="space-y-1">
        {(Object.keys(PRAYER_LABELS) as (keyof typeof data.timings)[]).map((name) => {
          const isCurrent = current === name
          const isNext = next === name && !isCurrent
          return (
            <div
              key={name}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                isCurrent
                  ? "bg-accent/15"
                  : "hover:bg-bg-card-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isCurrent
                      ? "bg-accent"
                      : isNext
                        ? "bg-prayer-next"
                        : "bg-text-secondary/30"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isCurrent ? "font-medium text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {PRAYER_LABELS[name]}
                </span>
                {isNext && (
                  <span className="rounded bg-prayer-next/20 px-1.5 py-0.5 text-[10px] font-medium text-prayer-next">
                    UP NEXT
                  </span>
                )}
              </div>
              <span
                className={`text-sm tabular-nums ${
                  isCurrent ? "font-semibold text-text-primary" : "text-text-secondary"
                }`}
              >
                {data.timings[name]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
