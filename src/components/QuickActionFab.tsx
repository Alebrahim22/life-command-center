"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  ListTodo,
  Clock,
  StickyNote,
  CheckSquare,
  X,
} from "lucide-react"

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  action: () => void
}

interface Props {
  onAddTodo?: () => void
  onLogShift?: () => void
  onQuickNote?: () => void
  onMarkHabits?: () => void
}

export default function QuickActionFab({
  onAddTodo,
  onLogShift,
  onQuickNote,
  onMarkHabits,
}: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on tap outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    // Delay to avoid same-event close
    const id = setTimeout(() => document.addEventListener("click", handleClick), 100)
    return () => {
      clearTimeout(id)
      document.removeEventListener("click", handleClick)
    }
  }, [open])

  const actions: QuickAction[] = [
    {
      id: "todo",
      label: "Add Task",
      icon: ListTodo,
      color: "from-blue-500 to-blue-600",
      action: () => { onAddTodo?.(); setOpen(false) },
    },
    {
      id: "shift",
      label: "Log Shift",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      action: () => { onLogShift?.(); setOpen(false) },
    },
    {
      id: "habit",
      label: "Mark Habit",
      icon: CheckSquare,
      color: "from-purple-500 to-purple-600",
      action: () => { onMarkHabits?.(); setOpen(false) },
    },
    {
      id: "note",
      label: "Quick Note",
      icon: StickyNote,
      color: "from-emerald-500 to-emerald-600",
      action: () => { onQuickNote?.(); setOpen(false) },
    },
  ]

  return (
    <div ref={menuRef} className="fixed bottom-24 right-4 z-30 md:bottom-8 md:right-8 flex flex-col items-end gap-3">
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

      {/* Main FAB button — Premium */}
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
    </div>
  )
}
