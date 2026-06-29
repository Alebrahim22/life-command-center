"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchPrayerTimes, type PrayerTimesData } from "@/lib/prayer-times"
import { fetchWeather, getWeatherCondition, getWeatherIcon, type WeatherData } from "@/lib/weather"
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
  ChevronDown, MapPin,
} from "lucide-react"

// ─── Helpers ───────────────────────────────────────────────────

const PRAYER_LABELS: Record<string, string> = {
  Fajr: "Fajr",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function getNextPrayer(prayers: { name: string; time: string; minutes: number }[], nowMinutes: number) {
  let next: { name: string; time: string; minutes: number } | null = null
  for (const p of prayers) {
    if (nowMinutes < p.minutes) {
      next = p
      break
    }
  }
  if (!next) next = prayers[0]
  return next
}

function getCurrentPrayer(prayers: { name: string; time: string; minutes: number }[], nowMinutes: number) {
  let current: { name: string; time: string } | null = null
  for (const p of prayers) {
    if (nowMinutes >= p.minutes) current = p
  }
  return current
}

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h >= 4 && h < 12) return { text: "صباح الخير", emoji: "🌅" }
  if (h >= 12 && h < 17) return { text: "مساء الخير", emoji: "☀️" }
  if (h >= 17 && h < 22) return { text: "مساء الخير", emoji: "🌆" }
  return { text: "تصبح على خير", emoji: "🌙" }
}

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

const weatherIconMap: Record<string, React.ElementType> = {
  sun: Sun, "cloud-sun": CloudSun, cloud: Cloud, "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle, "cloud-rain": CloudRain, "cloud-snow": CloudSnow, "cloud-lightning": CloudLightning,
}

// ─── Component ──────────────────────────────────────────────────

export default function TodayWidget() {
  // Clock
  const [now, setNow] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  // Data
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [prayerError, setPrayerError] = useState(false)
  const [weatherError, setWeatherError] = useState(false)

  // UI
  const [expanded, setExpanded] = useState(false)
  const [showAllPrayers, setShowAllPrayers] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchPrayerTimes().then(setPrayerData).catch(() => setPrayerError(true))
    fetchWeather().then(setWeather).catch(() => setWeatherError(true))
  }, [])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false })
  const seconds = now.getSeconds()

  const dayName = DAYS_AR[now.getDay()]
  const monthName = MONTHS_AR[now.getMonth()]
  const dateStr = `${dayName}، ${now.getDate()} ${monthName} ${now.getFullYear()}`

  const hours = now.getHours()
  const greeting = getGreeting()

  // Prayers
  const prayers = prayerData
    ? (Object.keys(PRAYER_LABELS) as (keyof typeof prayerData.timings)[]).map((name) => ({
        name,
        time: prayerData.timings[name],
        minutes: toMinutes(prayerData.timings[name]),
      }))
    : []

  const next = prayers.length > 0 ? getNextPrayer(prayers, nowMinutes) : null
  const current = prayers.length > 0 ? getCurrentPrayer(prayers, nowMinutes) : null

  // Countdown to next prayer
  const countdownText = next
    ? (() => {
        const diff = next.minutes - nowMinutes
        if (diff <= 0) return "Now"
        const h = Math.floor(diff / 60)
        const m = diff % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
      })()
    : "—"

  // Weather
  const WeatherIcon = weather ? weatherIconMap[getWeatherIcon(weather.weatherCode)] ?? Cloud : null
  const condition = weather ? getWeatherCondition(weather.weatherCode) : ""

  const isExpired = next && next.minutes - nowMinutes <= 0

  if (!mounted) {
    return <div className="glass-card h-48 animate-pulse" />
  }

  return (
    // ─── MAIN CONTAINER ──────────────────────────────────────
    <div
      className={`today-widget glass-card overflow-hidden transition-all duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      } ${expanded ? "ring-1 ring-accent/20 shadow-[0_0_40px_rgba(34,197,94,0.06)]" : ""}`}
      style={{ cursor: "default" }}
    >
      {/* ── Greeting Row ── */}
      <div className="px-4 sm:px-5 pt-3.5 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-600 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
            <span className="text-[11px] font-bold text-white">م</span>
          </div>
          <div>
            <p className="text-xs text-text-muted leading-none">{greeting.emoji} {greeting.text}</p>
            <p className="text-[15px] font-semibold text-text-primary leading-tight -mt-0.5">Mohammed</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <MapPin className="h-3 w-3" />
          <span>Kuwait</span>
        </div>
      </div>

      {/* ── Clock + Weather Row ── */}
      <div className="px-4 sm:px-5 pt-1 pb-2 flex items-end justify-between">
        {/* Clock */}
        <div className="flex items-baseline gap-0">
          <span className="text-4xl sm:text-5xl font-light tracking-tight text-text-primary">
            {timeStr.split(":").slice(0, 2).join(":")}
          </span>
          <span
            className="ml-0.5 text-sm font-mono text-accent/60 transition-opacity duration-300"
            style={{ opacity: seconds % 2 === 0 ? 1 : 0.25 }}
          >
            :{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* Weather */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-light text-text-primary">
              {weather ? `${weather.temperature}°` : "—"}
            </p>
            {weather && (
              <p className="text-[11px] text-text-muted -mt-0.5">
                H:{weather.high}° L:{weather.low}°
              </p>
            )}
          </div>
          {WeatherIcon && (
            <WeatherIcon className="h-8 w-8 text-text-secondary/70" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* ── Date Row ── */}
      <div className="px-4 sm:px-5 pb-2">
        <p className="text-xs text-text-secondary">{dateStr}</p>
        {prayerData && (
          <p className="text-[11px] text-text-muted font-mono">
            {prayerData.hijriDate.day} {prayerData.hijriDate.month} {prayerData.hijriDate.year} هـ
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 sm:mx-5 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ── Next Prayer (always visible) ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-3 flex items-center justify-between group transition-all duration-200 hover:bg-bg-card active:bg-bg-glass"
        aria-label={expanded ? "Collapse prayer times" : "Expand prayer times"}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            isExpired ? "bg-accent/10" : "bg-gradient-to-br from-accent/20 to-accent/5"
          } transition-all duration-300 group-hover:scale-105`}>
            <span className="text-xs font-bold text-accent">🕌</span>
          </div>
          <div className="text-left">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Next Prayer</p>
            <p className="text-sm font-semibold text-text-primary">
              {next ? PRAYER_LABELS[next.name] : "—"}
              <span className="ml-2 font-mono text-accent font-normal">
                {next?.time ?? ""}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown badge */}
          {next && (
            <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${
              isExpired
                ? "bg-accent/15 text-accent"
                : Number(countdownText.split(" ")[0]) < 1 && countdownText !== "Now"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-bg-glass text-text-secondary"
            }`}>
              {isExpired ? "● Now" : countdownText}
            </div>
          )}

          {/* Expand arrow */}
          <div className={`transform transition-transform duration-300 ease-spring ${
            expanded ? "rotate-180" : ""
          }`}>
            <ChevronDown className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors" />
          </div>
        </div>
      </button>

      {/* ── Expandable: All Prayers ── */}
      <div
        className="expand-grid"
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 pt-1 space-y-0.5">
            {prayers.map((p) => {
              const isCurrent = current?.name === p.name
              const isNext = next?.name === p.name && !isCurrent
              return (
                <div
                  key={p.name}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    isCurrent
                      ? "bg-accent/10 ring-1 ring-accent/20"
                      : isNext
                        ? "bg-blue-500/5"
                        : "hover:bg-bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${
                      isCurrent
                        ? "bg-accent shadow-[0_0_6px_rgba(34,197,94,0.3)]"
                        : isNext
                          ? "bg-blue-400"
                          : "bg-bg-glass"
                    }`} />
                    <span className={`text-sm ${
                      isCurrent ? "font-semibold text-text-primary" : "text-text-secondary"
                    }`}>
                      {PRAYER_LABELS[p.name]}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
                        Now
                      </span>
                    )}
                    {isNext && !isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">
                        Up Next
                      </span>
                    )}
                  </div>
                  <span className={`text-sm tabular-nums font-mono ${
                    isCurrent ? "font-semibold text-accent" : "text-text-secondary"
                  }`}>
                    {p.time}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
