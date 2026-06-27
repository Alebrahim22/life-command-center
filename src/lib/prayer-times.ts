export interface PrayerTimings {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

export interface HijriDate {
  day: string
  month: string
  year: string
}

export interface PrayerTimesData {
  timings: PrayerTimings
  hijriDate: HijriDate
  date: string
}

export async function fetchPrayerTimes(): Promise<PrayerTimesData> {
  const res = await fetch(
    "https://api.aladhan.com/v1/timings?latitude=29.3759&longitude=47.9774&method=0",
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) throw new Error("Failed to fetch prayer times")

  const json = await res.json()
  const d = json.data

  return {
    timings: {
      Fajr: d.timings.Fajr.replace(" (KWT)", ""),
      Dhuhr: d.timings.Dhuhr.replace(" (KWT)", ""),
      Asr: d.timings.Asr.replace(" (KWT)", ""),
      Maghrib: d.timings.Maghrib.replace(" (KWT)", ""),
      Isha: d.timings.Isha.replace(" (KWT)", ""),
    },
    hijriDate: {
      day: d.date.hijri.day,
      month: d.date.hijri.month.en,
      year: d.date.hijri.year,
    },
    date: d.date.readable,
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

export async function fetchHijriDate(): Promise<HijriDate> {
  const now = new Date()
  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
  const res = await fetch(
    `https://api.aladhan.com/v1/gToH?date=${dateStr}`
  )

  if (!res.ok) throw new Error("Failed to fetch hijri date")

  const json = await res.json()
  const h = json.data.hijri

  return {
    day: h.day,
    month: h.month.en,
    year: h.year,
  }
}
