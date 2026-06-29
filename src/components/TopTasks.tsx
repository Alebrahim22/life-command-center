"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { Todo, priorityOrder } from "@/lib/utils"

// ================================================================
// 🎯 Top 5 Tasks
// ================================================================

export default function TopTasks() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("todos")
      .select("*")
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((r: any): Todo => ({
            id: r.id,
            text: r.text,
            priority: r.priority,
            dueDate: r.due_date,
            completed: r.completed,
          }))
          mapped.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
          setTodos(mapped.slice(0, 5))
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <Skeleton className="h-48" />

  return (
    <MiniCard title="Top Priorities">
      {todos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Zap className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">All clear — nothing urgent</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {todos.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-bg-card"
            >
              <span
                className={`flex h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-bg-primary ${
                  t.priority === "high"
                    ? "bg-red-400 ring-red-400/20"
                    : t.priority === "medium"
                    ? "bg-amber-400 ring-amber-400/20"
                    : "bg-text-muted ring-border"
                }`}
              />
              <span className="flex-1 truncate text-sm text-text-primary">{t.text}</span>
              {t.dueDate && (
                <span className="shrink-0 text-[11px] font-mono text-text-muted">{t.dueDate}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}
