export interface WeatherData {
  temperature: number
  weatherCode: number
  high: number
  low: number
}

const conditions: Record<number, string> = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Slight Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Slight Showers",
  81: "Moderate Showers",
  82: "Violent Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Thunderstorm with Hail",
}

export function getWeatherCondition(code: number): string {
  return conditions[code] ?? "Unknown"
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return "sun"
  if (code <= 2) return "cloud-sun"
  if (code <= 3) return "cloud"
  if (code <= 48) return "cloud-fog"
  if (code <= 57) return "cloud-drizzle"
  if (code <= 67) return "cloud-rain"
  if (code <= 77) return "cloud-snow"
  if (code <= 86) return "cloud-rain"
  return "cloud-lightning"
}

export async function fetchWeather(): Promise<WeatherData> {
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    "latitude=29.3759&longitude=47.9774" +
    "&current=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min" +
    "&timezone=auto"

  const res = await fetch(url, { next: { revalidate: 1800 } })

  if (!res.ok) throw new Error("Failed to fetch weather")

  const json = await res.json()

  return {
    temperature: Math.round(json.current.temperature_2m),
    weatherCode: json.current.weather_code,
    high: Math.round(json.daily.temperature_2m_max[0]),
    low: Math.round(json.daily.temperature_2m_min[0]),
  }
}
