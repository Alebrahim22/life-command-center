"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface Event {
  id: string
  title: string
  date: string
  time: string | null
  category: "Personal" | "Work" | "Business" | "Legal" | "Medical"
  createdAt: string
}

const STORAGE_KEY = "events"
const CATEGORIES: Event["category"][] = ["Personal", "Work", "Business", "Legal", "Medical"]

const categoryColors: Record<string, string> = {
  Personal: "bg-accent/20 text-accent",
  Work: "bg-blue-500/20 text-blue-400",
  Business: "bg-amber-500/20 text-amber-400",
  Legal: "bg-purple-500/20 text-purple-400",
  Medical: "bg-red-500/20 text-red-400",
}

function load(): Event[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]
}

function endOfWeek(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 0 : 6 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split("T")[0]
}

interface Group {
  label: string
  events: Event[]
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [category, setCategory] = useState<Event["category"]>("Personal")

  useEffect(() => {
    setEvents(load())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events, loaded])

  function addEvent() {
    if (!title.trim() || !date) return
    const ev: Event = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: title.trim(),
      date,
      time: time || null,
      category,
      createdAt: new Date().toISOString(),
    }
    setEvents((prev) => [...prev, ev])
    setTitle("")
    setDate("")
    setTime("")
    setShowForm(false)
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const today = todayStr()
  const weekEnd = endOfWeek()

  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))

  const groups: Group[] = [
    { label: "Today", events: upcoming.filter((e) => e.date === today) },
    {
      label: "This Week",
      events: upcoming.filter((e) => e.date > today && e.date <= weekEnd),
    },
    { label: "Later", events: upcoming.filter((e) => e.date > weekEnd) },
  ].filter((g) => g.events.length > 0)

  if (!loaded) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Upcoming Events</h2>
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-secondary">Upcoming Events</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
        >
          {showForm ? "Cancel" : "+ Event"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-bg-card-hover p-3">
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-white placeholder-text-secondary outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Event["category"])}
              className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={addEvent}
              className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <p className="py-6 text-center text-sm text-text-secondary">No upcoming events</p>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.events.map((ev) => (
                <div
                  key={ev.id}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bg-card-hover"
                >
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{ev.title}</p>
                    <p className="text-[10px] text-text-secondary">
                      {ev.date}
                      {ev.time ? ` ${ev.time}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[ev.category]}`}
                  >
                    {ev.category}
                  </span>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
