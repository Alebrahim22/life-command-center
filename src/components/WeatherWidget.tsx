"use client"

import { useState, useEffect } from "react"
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from "lucide-react"
import { fetchWeather, getWeatherCondition, getWeatherIcon, type WeatherData } from "@/lib/weather"

const iconMap: Record<string, React.ElementType> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Weather</h2>
        <p className="text-sm text-red-400">Failed to load weather</p>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Weather</h2>
        <div className="h-24 animate-pulse rounded bg-border" />
      </div>
    )
  }

  const Icon = iconMap[getWeatherIcon(weather.weatherCode)] ?? Cloud
  const condition = getWeatherCondition(weather.weatherCode)

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Weather</h2>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-5xl font-light tracking-tight">{weather.temperature}°</span>
          <p className="mt-1 text-sm text-text-secondary">{condition}</p>
        </div>
        <Icon className="h-12 w-12 text-text-secondary" strokeWidth={1.5} />
      </div>
      <div className="mt-4 flex gap-4 text-sm text-text-secondary">
        <span>
          H: <span className="text-orange-400">{weather.high}°</span>
        </span>
        <span>
          L: <span className="text-blue-400">{weather.low}°</span>
        </span>
      </div>
    </div>
  )
}
