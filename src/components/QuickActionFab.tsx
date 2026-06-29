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
      color: "bg-blue-500",
      action: () => { onAddTodo?.(); setOpen(false) },
    },
    {
      id: "shift",
      label: "Log Shift",
      icon: Clock,
      color: "bg-amber-500",
      action: () => { onLogShift?.(); setOpen(false) },
    },
    {
      id: "habit",
      label: "Mark Habit",
      icon: CheckSquare,
      color: "bg-purple-500",
      action: () => { onMarkHabits?.(); setOpen(false) },
    },
    {
      id: "note",
      label: "Quick Note",
      icon: StickyNote,
      color: "bg-emerald-500",
      action: () => { onQuickNote?.(); setOpen(false) },
    },
  ]

  return (
    <div ref={menuRef} className="fixed bottom-24 right-4 z-30 md:bottom-8 md:right-8 flex flex-col items-end gap-3">
      {/* Menu items */}
      {open && (
        <div className="flex flex-col items-end gap-2">
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={a.action}
                className="flex items-center gap-2 rounded-xl bg-bg-card border border-border px-4 py-2.5 shadow-lg transition-all hover:scale-105 min-h-[44px]"
              >
                <span className="text-xs font-medium text-text-primary whitespace-nowrap">
                  {a.label}
                </span>
                <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${a.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center h-14 w-14 rounded-full bg-accent text-white shadow-lg transition-all active:scale-90 hover:scale-105 fab-pulse ${
          open ? "rotate-45" : ""
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
