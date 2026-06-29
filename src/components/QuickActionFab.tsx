"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  ListTodo,
  Clock,
  StickyNote,
  CheckSquare,
  X,
  Send,
  Sunrise,
  Sunset,
  Moon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { HABITS, todayKey } from "@/lib/utils"

type ActiveModal = null | "todo" | "shift" | "habit" | "note"

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  action: () => void
}

export default function QuickActionFab() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<ActiveModal>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Todo state ──
  const [todoText, setTodoText] = useState("")
  const [todoPriority, setTodoPriority] = useState<"high" | "medium" | "low">("medium")
  const [todoDue, setTodoDue] = useState("")
  const [todoSubmitting, setTodoSubmitting] = useState(false)

  // ── Shift state ──
  const [shiftType, setShiftType] = useState<"morning" | "evening" | "night">("morning")
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split("T")[0])
  const [shiftSubmitting, setShiftSubmitting] = useState(false)

  // ── Habit state ──
  const [habitData, setHabitData] = useState<Record<string, string[]>>({})
  const [habitLoaded, setHabitLoaded] = useState(false)

  // ── Note state ──
  const [noteText, setNoteText] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Close menu on tap outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const id = setTimeout(() => document.addEventListener("click", handleClick), 100)
    return () => {
      clearTimeout(id)
      document.removeEventListener("click", handleClick)
    }
  }, [open])

  // Load habits when habit modal opens
  useEffect(() => {
    if (modal !== "habit" || habitLoaded) return
    supabase
      .from("habits")
      .select("date_key, habit_id")
      .then(({ data: rows }) => {
        const map: Record<string, string[]> = {}
        if (rows) {
          for (const r of rows) {
            const key = r.date_key
            if (!map[key]) map[key] = []
            map[key].push(r.habit_id)
          }
        }
        setHabitData(map)
        setHabitLoaded(true)
      })
  }, [modal, habitLoaded])

  // Close modal handler
  function closeModal() {
    setModal(null)
    setTodoText("")
    setTodoDue("")
    setTodoPriority("medium")
    setTodoSubmitting(false)
    setShiftDate(new Date().toISOString().split("T")[0])
    setShiftType("morning")
    setShiftSubmitting(false)
    setNoteText("")
    setNoteSubmitting(false)
  }

  // ── Todo submit ──
  async function handleAddTodo() {
    const trimmed = todoText.trim()
    if (!trimmed) return
    setTodoSubmitting(true)
    const { error } = await supabase.from("todos").insert({
      text: trimmed,
      priority: todoPriority,
      due_date: todoDue || null,
      completed: false,
    })
    setTodoSubmitting(false)
    if (error) {
      console.error("Failed to add todo:", error)
      return
    }
    closeModal()
  }

  // ── Shift submit ──
  async function handleLogShift() {
    setShiftSubmitting(true)
    const { error } = await supabase.from("shifts").insert({
      type: "work",
      date: shiftDate,
    })
    setShiftSubmitting(false)
    if (error) {
      console.error("Failed to log shift:", error)
      return
    }
    closeModal()
  }

  // ── Habit toggle ──
  function handleToggleHabit(id: string) {
    const key = todayKey()
    const doneToday = habitData[key] || []
    const exists = doneToday.includes(id)

    // Optimistic UI
    setHabitData((prev) => {
      const d = prev[key] || []
      return { ...prev, [key]: exists ? d.filter((x) => x !== id) : [...d, id] }
    })

    // Supabase sync
    if (exists) {
      supabase.from("habits").delete().eq("date_key", key).eq("habit_id", id)
    } else {
      supabase.from("habits").insert({ date_key: key, habit_id: id })
    }
  }

  // ── Note submit (localStorage) ──
  function handleSaveNote() {
    const trimmed = noteText.trim()
    if (!trimmed) return
    setNoteSubmitting(true)

    const key = `quick-notes-${todayKey()}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    existing.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      text: trimmed,
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem(key, JSON.stringify(existing))
    setNoteSubmitting(false)
    closeModal()
  }

  const actions: QuickAction[] = [
    {
      id: "todo",
      label: "Add Task",
      icon: ListTodo,
      color: "from-blue-500 to-blue-600",
      action: () => { setOpen(false); setModal("todo") },
    },
    {
      id: "shift",
      label: "Log Shift",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      action: () => { setOpen(false); setModal("shift") },
    },
    {
      id: "habit",
      label: "Mark Habit",
      icon: CheckSquare,
      color: "from-purple-500 to-purple-600",
      action: () => { setOpen(false); setModal("habit") },
    },
    {
      id: "note",
      label: "Quick Note",
      icon: StickyNote,
      color: "from-emerald-500 to-emerald-600",
      action: () => { setOpen(false); setModal("note") },
    },
  ]

  const SHIFT_OPTIONS = [
    { value: "morning" as const, label: "Morning Shift", icon: Sunrise, color: "text-amber-400" },
    { value: "evening" as const, label: "Evening Shift", icon: Sunset, color: "text-orange-400" },
    { value: "night" as const, label: "Night Shift", icon: Moon, color: "text-blue-400" },
  ]

  const todayHabits = habitData[todayKey()] || []

  return (
    <div ref={menuRef} className="fixed bottom-24 end-4 z-30 md:bottom-8 md:end-8 flex flex-col items-end gap-3">
      {/* Menu items */}
      {open && (
        <div className="flex flex-col items-end gap-2 animate-scale-in">
          {actions.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={a.action}
                className="group flex items-center gap-2.5 rounded-2xl glass-card-static px-4 py-2.5 shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl min-h-[48px]"
                style={{ animationDelay: `${i * 40}ms`, animation: "fade-slide-up 300ms ease-out both" }}
              >
                <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                  {a.label}
                </span>
                <div className={`flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br ${a.color} shadow-inner`}>
                  <Icon className="h-[18px] w-[18px] text-white" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-accent to-emerald-600 text-white shadow-[0_4px_24px_rgba(34,197,94,0.3)] transition-all duration-300 active:scale-90 hover:scale-105 hover:shadow-[0_8px_32px_rgba(34,197,94,0.4)] fab-pulse ${
          open ? "rotate-45 shadow-[0_4px_24px_rgba(34,197,94,0.4)]" : ""
        }`}
        aria-label={open ? "Close actions" : "Quick actions"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>

      {/* ─── MODAL BACKDROP ─── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-surface/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          {/* ─── MODAL CONTAINER ─── */}
          <div className="glass-card-static w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text-primary">
                {modal === "todo" && "Add Task"}
                {modal === "shift" && "Log Shift"}
                {modal === "habit" && "Mark Habits"}
                {modal === "note" && "Quick Note"}
              </h2>
              <button
                onClick={closeModal}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-glass transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── TODO MODAL ── */}
            {modal === "todo" && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleAddTodo() }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Task</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-border bg-bg-glass px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Priority</label>
                    <select
                      value={todoPriority}
                      onChange={(e) => setTodoPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-bg-glass px-3 py-3 text-sm text-text-primary outline-none transition-all focus:border-accent"
                    >
                      <option value="high">🔥 High</option>
                      <option value="medium">⚡ Medium</option>
                      <option value="low">· Low</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Due date</label>
                    <input
                      type="date"
                      value={todoDue}
                      onChange={(e) => setTodoDue(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg-glass px-3 py-3 text-sm text-text-primary outline-none transition-all focus:border-accent"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!todoText.trim() || todoSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {todoSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {todoSubmitting ? "Adding..." : "Add Task"}
                </button>
              </form>
            )}

            {/* ── SHIFT MODAL ── */}
            {modal === "shift" && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleLogShift() }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2">Shift Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SHIFT_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isActive = shiftType === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setShiftType(opt.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                            isActive
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-bg-glass text-text-muted hover:border-text-muted/30 hover:text-text-secondary"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${opt.color}`} />
                          <span>{opt.label.split(" ")[0]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Date</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-border bg-bg-glass px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={shiftSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {shiftSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {shiftSubmitting ? "Logging..." : "Log Shift"}
                </button>
              </form>
            )}

            {/* ── HABIT MODAL ── */}
            {modal === "habit" && (
              <div className="space-y-1">
                {!habitLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : (
                  HABITS.map((h) => (
                    <label
                      key={h.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-bg-glass"
                    >
                      <input
                        type="checkbox"
                        checked={todayHabits.includes(h.id)}
                        onChange={() => handleToggleHabit(h.id)}
                        className="h-4 w-4 rounded border-border bg-bg-glass text-accent focus:ring-accent/30 accent-[#22c55e]"
                      />
                      <span className="text-sm text-text-primary">{h.label}</span>
                    </label>
                  ))
                )}
                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    onClick={closeModal}
                    className="w-full rounded-xl bg-bg-glass px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTE MODAL ── */}
            {modal === "note" && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSaveNote() }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Your note</label>
                  <textarea
                    placeholder="Write something..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={5}
                    autoFocus
                    className="w-full resize-none rounded-xl border border-border bg-bg-glass px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!noteText.trim() || noteSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {noteSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {noteSubmitting ? "Saving..." : "Save Note"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
