"use client"

import { ChevronDown } from "lucide-react"

// ================================================================
// 🃏 SummaryCard — Accordion Life Summary
// ================================================================

export default function SummaryCard({
  id,
  emoji,
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  id: string
  emoji: string
  title: string
  summary: string
  isOpen: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`group border border-white/[0.06] bg-zinc-900/30 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:border-white/[0.12] ${
        isOpen ? 'ring-1 ring-accent/10 shadow-[0_0_30px_rgba(34,197,94,0.04)]' : ''
      }`}
    >
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{emoji}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">{title}</h3>
            {!isOpen && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[240px]">{summary}</p>}
          </div>
        </div>
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'bg-accent/10 rotate-180' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
        }`}>
          <ChevronDown className={`h-3.5 w-3.5 transition-all duration-200 ${
            isOpen ? 'text-accent' : 'text-zinc-400'
          }`} />
        </div>
      </button>
      {/* Grid-rows accordion: smooth height transition without max-h hack */}
      <div
        className={`grid transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] p-4 pt-3 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
