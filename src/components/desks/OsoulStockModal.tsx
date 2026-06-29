"use client"

import { X } from "lucide-react"

interface StockModalProps {
  open: boolean
  form: { ticker: string; shares: string; avgPrice: string; currentPrice: string }
  editIndex: number | null
  onClose: () => void
  onSave: (e: React.FormEvent) => void
  onChange: (f: StockModalProps["form"]) => void
}

export default function OsoulStockModal({ open, form, editIndex, onClose, onSave, onChange }: StockModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-surface/80 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border-border bg-bg-glass-strong backdrop-blur-md shadow-overlay transition-all duration-300">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-bold text-text-primary">{editIndex !== null ? "Modify Holding" : "New Asset"}</h2>
          <button onClick={onClose}><X size={18} className="text-text-secondary" /></button>
        </div>
        <form onSubmit={onSave} className="space-y-3 p-4">
          <input required placeholder="Ticker" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.ticker} onChange={(e) => onChange({ ...form, ticker: e.target.value })} />
          <input required type="number" placeholder="Shares" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.shares} onChange={(e) => onChange({ ...form, shares: e.target.value })} />
          <input required type="number" step="0.001" placeholder="Avg Price" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.avgPrice} onChange={(e) => onChange({ ...form, avgPrice: e.target.value })} />
          <input required type="number" step="0.001" placeholder="Current Price" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={form.currentPrice} onChange={(e) => onChange({ ...form, currentPrice: e.target.value })} />
          <button type="submit" className="w-full rounded-lg bg-text-primary py-2.5 text-[10px] font-black uppercase tracking-widest text-accent">
            Commit Inventory
          </button>
        </form>
      </div>
    </div>
  )
}
