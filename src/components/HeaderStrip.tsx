"use client"

import { useState, useEffect } from "react"
import { fetchHijriDate, type HijriDate } from "@/lib/prayer-times"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function HeaderStrip() {
  const [now, setNow] = useState(new Date())
  const [hijri, setHijri] = useState<HijriDate | null>(null)

  useEffect(() => {
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

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-6 py-4">
      <div className="flex items-baseline gap-5">
        <span className="text-3xl font-semibold tracking-tight">{timeStr}</span>
        <div className="hidden sm:block">
          <p className="text-sm text-[#a0a0a0]">{dateStr}</p>
          {hijri && (
            <p className="text-sm text-[#a0a0a0]">
              {hijri.day} {hijri.month} {hijri.year} AH
            </p>
          )}
        </div>
      </div>
      <div className="sm:hidden text-right">
        <p className="text-xs text-[#a0a0a0]">{dateStr}</p>
        {hijri && (
          <p className="text-xs text-[#a0a0a0]">
            {hijri.day} {hijri.month} {hijri.year} AH
          </p>
        )}
      </div>
    </div>
  )
}
