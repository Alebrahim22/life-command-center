"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, ListTodo } from "lucide-react"
import Checkbox from "@/components/Checkbox"
import { supabase } from "@/lib/supabase"

interface Todo {
  id: string
  text: string
  priority: "high" | "medium" | "low"
  dueDate: string | null
  completed: boolean
  createdAt: string
}

type Filter = "all" | "active" | "completed"

const priorityColors: Record<string, string> = {
  high: "bg-red-400 ring-red-400/20",
  medium: "bg-amber-400 ring-amber-400/20",
  low: "bg-text-muted ring-border",
}

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [text, setText] = useState("")
  const [priority, setPriority] = useState<"medium" | "high" | "low">("medium")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch todos:", error)
    } else if (data) {
      setTodos(
        data.map((row: any) => ({
          id: row.id,
          text: row.text,
          priority: row.priority,
          dueDate: row.due_date,
          completed: row.completed,
          createdAt: row.created_at,
        })),
      )
    }
    setLoading(false)
  }

  async function addTodo() {
    const trimmed = text.trim()
    if (!trimmed) return

    const { data, error } = await supabase
      .from("todos")
      .insert({
        text: trimmed,
        priority,
        due_date: dueDate || null,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add todo:", error)
    } else if (data) {
      setTodos((prev) => [
        {
          id: data.id,
          text: data.text,
          priority: data.priority,
          dueDate: data.due_date,
          completed: data.completed,
          createdAt: data.created_at,
        },
        ...prev,
      ])
      setText("")
      setDueDate("")
    }
  }

  async function toggleTodo(id: string, current: boolean) {
    const { error } = await supabase.from("todos").update({ completed: !current }).eq("id", id)
    if (!error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !current } : t)))
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from("todos").delete().eq("id", id)
    if (!error) {
      setTodos((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const filtered =
    filter === "all" ? todos : filter === "active" ? todos.filter((t) => !t.completed) : todos.filter((t) => t.completed)

  if (loading) {
    return (
      <div className="glass-card-static p-5">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          <span className="mr-2 inline-block h-[3px] w-[3px] rounded-full bg-accent" />
          Tasks
        </h3>
        <div className="skeleton-shimmer h-8 rounded-lg mb-2" />
        <div className="skeleton-shimmer h-8 rounded-lg mb-2" />
        <div className="skeleton-shimmer h-8 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="glass-card-static p-5 transition-all duration-300 hover:border-border-hover">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          <span className="inline-block h-[3px] w-[3px] rounded-full bg-accent" />
          Tasks
        </h3>
        <span className="text-[11px] font-mono text-text-muted">{todos.filter((t) => !t.completed).length} active</span>
      </div>

      {/* Add form */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-bg-card p-2.5">
        <input
          type="text"
          placeholder="Add a task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="rounded-lg border border-border bg-bg-glass px-2 py-1.5 text-[11px] font-medium text-text-secondary outline-none"
        >
          <option value="high">🔥 High</option>
          <option value="medium">⚡ Med</option>
          <option value="low">· Low</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-border bg-bg-glass px-2 py-1.5 text-[11px] font-mono text-text-secondary outline-none"
        />
        <button
          onClick={addTodo}
          disabled={!text.trim()}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3 flex items-center gap-1">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 ${
              filter === f ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <ListTodo className="h-7 w-7 text-text-muted/30" />
          <p className="text-sm text-text-muted">
            {filter === "all" ? "No tasks yet" : filter === "active" ? "All done! 🎉" : "No completed tasks"}
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-bg-card"
            >
              <Checkbox checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} />
              <span
                className={`flex-1 truncate text-sm transition-all ${
                  t.completed ? "text-text-muted line-through" : "text-text-primary"
                }`}
              >
                {t.text}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`flex h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-bg-primary ${priorityColors[t.priority]}`} />
                <span className="text-[11px] text-text-muted">{priorityLabels[t.priority]}</span>
              </span>
              {t.dueDate && <span className="text-[11px] font-mono text-text-muted">{t.dueDate}</span>}
              <button
                onClick={() => deleteTodo(t.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
