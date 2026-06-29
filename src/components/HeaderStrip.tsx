"use client"

import { useState, useEffect } from "react"
import { fetchHijriDate, type HijriDate } from "@/lib/prayer-times"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function HeaderStrip() {
  const [now, setNow] = useState(new Date())
  const [hijri, setHijri] = useState<HijriDate | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchHijriDate().then(setHijri).catch(() => setHijri(null))
  }, [])

  const dayName = days[now.getDay()]
  const monthName = months[now.getMonth()]
  const dateStr = `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false })
  const seconds = now.getSeconds()

  return (
    <div
      className={`glass-card-static flex items-center justify-between px-6 py-4 transition-all duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Left: Time */}
      <div className="flex items-baseline gap-4">
        <div className="flex items-baseline gap-0">
          <span
            data-num
            className="text-3xl font-semibold tracking-tight text-text-primary transition-all duration-200"
          >
            {timeStr.split(":").slice(0, 2).join(":")}
          </span>
          <span
            className="ml-0.5 text-[13px] font-mono text-accent/60 transition-all duration-300"
            style={{
              opacity: seconds % 2 === 0 ? 1 : 0.3,
            }}
          >
            :{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* Desktop: Date + Hijri */}
        <div className="hidden sm:block border-l border-border/50 pl-4">
          <p className="text-sm text-text-secondary leading-tight">{dateStr}</p>
          {hijri && (
            <p className="text-xs text-text-muted mt-0.5 font-mono tracking-wide">
              {hijri.day} {hijri.month} {hijri.year} AH
            </p>
          )}
        </div>
      </div>

      {/* Mobile: Date + Hijri */}
      <div className="sm:hidden text-right">
        <p className="text-xs text-text-secondary">{dateStr}</p>
        {hijri && (
          <p className="text-[11px] text-text-muted font-mono">
            {hijri.day} {hijri.month} {hijri.year} AH
          </p>
        )}
      </div>
    </div>
  )
}
