"use client"

import type { RadarStock } from "../OsoulArchitect"
import { X } from "lucide-react"

interface RadarModalProps {
  open: boolean
  form: { ticker: string; name: string; price: string; fv: string; eps: string; roe: string; yield: string; upcomingDividend: boolean }
  editIndex: number | null
  onClose: () => void
  onSave: (e: React.FormEvent) => void
  onChange: (f: RadarModalProps["form"]) => void
}

export default function OsoulRadarModal({ open, form, editIndex, onClose, onSave, onChange }: RadarModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-surface/80 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border-border bg-bg-glass-strong backdrop-blur-md shadow-overlay transition-all duration-300">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-bold text-text-primary">{editIndex !== null ? "Modify Radar" : "New Radar Asset"}</h2>
          <button onClick={onClose}><X size={18} className="text-text-secondary" /></button>
        </div>
        <form onSubmit={onSave} className="space-y-3 p-4">
          <input required placeholder="Ticker" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.ticker} onChange={(e) => onChange({ ...form, ticker: e.target.value })} />
          <input required placeholder="Name" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" step="0.001" placeholder="Price" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.price} onChange={(e) => onChange({ ...form, price: e.target.value })} />
            <input type="number" step="0.001" placeholder="FV" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.fv} onChange={(e) => onChange({ ...form, fv: e.target.value })} />
            <input type="number" step="0.001" placeholder="EPS" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.eps} onChange={(e) => onChange({ ...form, eps: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.1" placeholder="ROE %" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.roe} onChange={(e) => onChange({ ...form, roe: e.target.value })} />
            <input type="number" step="0.1" placeholder="Yield %" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.yield} onChange={(e) => onChange({ ...form, yield: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <input type="checkbox" checked={form.upcomingDividend} onChange={(e) => onChange({ ...form, upcomingDividend: e.target.checked })} className="accent-accent" />
            Upcoming Dividend
          </label>
          <button type="submit" className="w-full rounded-lg bg-text-primary py-2.5 text-[10px] font-black uppercase tracking-widest text-accent">
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  )
}
