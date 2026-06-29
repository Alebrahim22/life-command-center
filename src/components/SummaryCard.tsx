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
      className={`group glass-card-static transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:border-border-hover ${
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
            {!isOpen && <p className="text-xs text-text-muted mt-0.5 truncate max-w-[240px]">{summary}</p>}
          </div>
        </div>
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'bg-accent/10 rotate-180' : 'bg-bg-card group-hover:bg-bg-glass'
        }`}>
          <ChevronDown className={`h-3.5 w-3.5 transition-all duration-200 ${
            isOpen ? 'text-accent' : 'text-text-muted'
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
          <div className="border-t border-border p-4 pt-3 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
