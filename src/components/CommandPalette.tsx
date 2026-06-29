"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Sparkles, BarChart3, LayoutDashboard, Shield, ArrowUpRight, Command } from "lucide-react"

type DeskId = "overview" | "financial" | "operating" | "vault"

interface Action {
  id: string
  label: string
  desc: string
  icon: React.ElementType
  onPick: () => void
  shortcut?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (desk: DeskId) => void
}

const DESK_ACTIONS: { id: DeskId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "overview", label: "Overview", icon: Sparkles, desc: "Life at a glance" },
  { id: "financial", label: "Financial Desk", icon: BarChart3, desc: "Portfolio, Osoul & Trades" },
  { id: "operating", label: "Operating Desk", icon: LayoutDashboard, desc: "Shifts, Tasks & Projects" },
  { id: "vault", label: "The Vault", icon: Shield, desc: "Legal, Bills & Budget" },
]

export default function CommandPalette({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const allActions: Action[] = [
    ...DESK_ACTIONS.map((d) => ({
      id: `desk-${d.id}`,
      label: `Go to ${d.label}`,
      desc: d.desc,
      icon: d.icon,
      onPick: () => { onNavigate(d.id); onClose() },
    })),
  ]

  const filtered = query.trim()
    ? allActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : allActions

  // Reset index when filtered list changes
  useEffect(() => { setSelectedIdx(0) }, [filtered.length])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const pick = useCallback((idx: number) => {
    if (idx >= 0 && idx < filtered.length) {
      filtered[idx].onPick()
    }
  }, [filtered])

  // Keyboard handlers
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((p) => Math.min(p + 1, filtered.length - 1)); return }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((p) => Math.max(p - 1, 0)); return }
      if (e.key === "Enter") { e.preventDefault(); pick(selectedIdx); return }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, filtered, selectedIdx, pick, onClose])

  // Click-outside
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest("[data-palette]")) return
      onClose()
    }
    // Delay to prevent the same click from closing
    const timer = setTimeout(() => document.addEventListener("click", onClick), 100)
    return () => { clearTimeout(timer); document.removeEventListener("click", onClick) }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-surface/80 backdrop-blur-sm" />

      {/* Palette */}
      <div
        data-palette
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-hover bg-bg-glass-strong shadow-overlay backdrop-blur-xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search desks, commands…"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted/50"
          />
          <kbd className="hidden rounded-md border border-border-hover bg-bg-glass px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto overscroll-contain p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">
              No results for "{query}"
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((action, i) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => pick(i)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      i === selectedIdx
                        ? "bg-accent/15 text-accent shadow-sm"
                        : "text-text-secondary hover:bg-bg-glass hover:text-text-primary"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${i === selectedIdx ? "text-accent" : "text-text-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{action.label}</div>
                      <div className="text-[11px] text-text-muted truncate">{action.desc}</div>
                    </div>
                    <ArrowUpRight className={`h-3 w-3 shrink-0 transition-opacity ${
                      i === selectedIdx ? "opacity-100 text-accent" : "opacity-0"
                    }`} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted/60">
            <kbd className="rounded border border-border-hover bg-bg-glass px-1 py-0.5 text-[9px]">↑</kbd>
            <kbd className="rounded border border-border-hover bg-bg-glass px-1 py-0.5 text-[9px]">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted/60">
            <kbd className="rounded border border-border-hover bg-bg-glass px-1.5 py-0.5 text-[9px]">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted/60">
            <kbd className="rounded border border-border-hover bg-bg-glass px-1.5 py-0.5 text-[9px]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
