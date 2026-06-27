"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"

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
  low: "text-[#a0a0a0]",
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
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Todo</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#a0a0a0]">Todo</h2>

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          placeholder="Add a task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          className="min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-[#222] px-3 py-2 text-sm text-white placeholder-[#666] outline-none focus:border-[#22c55e]"
        />
        <button
          onClick={addTodo}
          className="rounded-lg bg-[#22c55e] bg-opacity-20 px-4 py-2 text-sm font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
        >
          Add
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
          className="rounded-lg border border-[#2a2a2a] bg-[#222] px-2 py-1.5 text-xs text-white outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-[#2a2a2a] bg-[#222] px-2 py-1.5 text-xs text-white outline-none [color-scheme:dark]"
        />
      </div>

      <div className="mb-3 flex gap-1 rounded-lg bg-[#222] p-1 text-xs">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-md px-3 py-1.5 capitalize transition-colors ${
              filter === f ? "bg-[#333] text-white" : "text-[#a0a0a0] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-[#666]">No tasks yet</p>
      )}

      <div className="space-y-1">
        {filtered.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[#222]"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleComplete(todo.id)}
              className="h-4 w-4 cursor-pointer accent-[#22c55e]"
            />
            <span
              className={`flex-1 text-sm ${
                todo.completed ? "text-[#555] line-through" : "text-[#e0e0e0]"
              }`}
            >
              {todo.text}
            </span>
            <span className={`text-[10px] font-medium uppercase ${priorityColors[todo.priority]}`}>
              {priorityLabels[todo.priority]}
            </span>
            {todo.dueDate && (
              <span className="text-[10px] text-[#666]">{todo.dueDate}</span>
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
