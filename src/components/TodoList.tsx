"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import Checkbox from "@/components/Checkbox"

interface Todo {
  id: string
  text: string
  priority: "high" | "medium" | "low"
  dueDate: string | null
  completed: boolean
  createdAt: string
}

type Filter = "all" | "active" | "completed"

const STORAGE_KEY = "todos"

function load(): Todo[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const priorityColors: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-text-secondary",
}

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [text, setText] = useState("")
  const [priority, setPriority] = useState<"medium" | "high" | "low">("medium")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    setTodos(load())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos, loaded])

  function addTodo() {
    const trimmed = text.trim()
    if (!trimmed) return
    const todo: Todo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      text: trimmed,
      priority,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos((prev) => [todo, ...prev])
    setText("")
    setDueDate("")
  }

  function toggleComplete(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed
    if (filter === "completed") return t.completed
    return true
  })

  if (!loaded) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Todo</h2>
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Todo</h2>

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          placeholder="Add a task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg-card-hover px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent"
        />
        <button
          onClick={addTodo}
          className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
        >
          Add
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
          className="rounded-lg border border-border bg-bg-card-hover px-2 py-1.5 text-xs text-text-primary outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-border bg-bg-card-hover px-2 py-1.5 text-xs text-text-primary outline-none [color-scheme:dark]"
        />
      </div>

      <div className="mb-3 flex gap-1 rounded-lg bg-bg-card-hover p-1 text-xs">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-md px-3 py-1.5 capitalize transition-colors ${
              filter === f ? "bg-bg-card-hover text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-text-secondary">No tasks yet</p>
      )}

      <div className="space-y-1">
        {filtered.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-bg-card-hover"
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => toggleComplete(todo.id)}
            />
            <span
              className={`flex-1 text-sm ${
                todo.completed ? "text-text-secondary line-through" : "text-text-primary"
              }`}
            >
              {todo.text}
            </span>
            <span className={`text-[10px] font-medium uppercase ${priorityColors[todo.priority]}`}>
              {priorityLabels[todo.priority]}
            </span>
            {todo.dueDate && (
              <span className="text-[10px] text-text-secondary">{todo.dueDate}</span>
            )}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
