"use client"

import { X, FileText, FileDown, RefreshCw } from "lucide-react"

interface RadarStock { ticker: string; name: string; price: number; fv: number | null; eps: number | null; roe: number | null; yield: number | null; specialFlag?: string | null; news?: string | null; sentimentApplied?: boolean; upcomingDividend?: boolean }

interface ReportModalProps {
  open: boolean
  reportRef: React.RefObject<HTMLDivElement | null>
  isExportingPDF: boolean
  allocationResult: { activeTier: string; description: string; targets: any[]; isDefensive: boolean; traps: any[] }
  marketData: RadarStock[]
  totalInvested: number
  currentValue: number
  profitPercentage: string
  currentMonthYear: string
  getRadarStatus: (s: RadarStock) => { label: string; className: string }
  onClose: () => void
  onExportPDF: () => void
}

export default function OsoulReportModal({ open, reportRef, isExportingPDF, allocationResult, marketData, totalInvested, currentValue, profitPercentage, currentMonthYear, getRadarStatus, onClose, onExportPDF }: ReportModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-surface/80 p-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-xl border-border bg-bg-glass-strong backdrop-blur-md shadow-overlay transition-all duration-300">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-card-hover p-4">
          <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
            <FileText size={15} /> Engineering Intelligence
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={onExportPDF} disabled={isExportingPDF}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase transition-colors ${isExportingPDF ? "cursor-wait opacity-50" : ""} bg-accent/20 text-accent hover:bg-accent/30`}>
              {isExportingPDF ? <RefreshCw className="animate-spin" size={13} /> : <FileDown size={13} />}
              {isExportingPDF ? "Baking PDF..." : "Download PDF"}
            </button>
            <button onClick={onClose}><X size={18} className="text-text-secondary" /></button>
          </div>
        </div>
        <div ref={reportRef} className="overflow-y-auto bg-bg-primary p-8">
          <div className="mb-6 flex items-start justify-between border-b-2 border-text-primary pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-text-primary">
                <span className="text-2xl font-bold text-accent">O</span>
              </div>
              <div>
                <h1 className="text-xl font-black uppercase italic tracking-tight text-text-primary">Architect Intelligence Ledger</h1>
                <p className="text-xs font-medium tracking-wider uppercase text-text-muted">Osoul Portfolio Optimization Framework</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium tracking-wider uppercase text-text-muted">Filing Period</p>
              <p className="text-base font-black text-text-primary">{currentMonthYear}</p>
            </div>
          </div>

          <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-text-primary">
            <div className="h-4 w-1 bg-accent" /> 1. Market Optimization
          </h3>
          <div className="mb-6 rounded-lg border-l-4 border-accent bg-bg-card-hover p-5">
            <h4 className="mb-1 text-sm font-black uppercase text-text-primary">
              Strategy Node: <span className="text-accent">{allocationResult.activeTier}</span>
            </h4>
            <p className="mb-4 text-[11px] font-bold leading-relaxed text-text-secondary">{allocationResult.description}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {allocationResult.targets.map((t: any, i: number) => (
                <div key={i} className="rounded-lg border border-border bg-bg-card p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-text-primary">{t.ticker}</span>
                    <span className="text-xs font-black text-accent">{t.allocation.toFixed(3)} KD</span>
                  </div>
                  <p className="mb-1 text-xs font-medium tracking-wider uppercase text-text-muted">{t.weight.toFixed(1)}% Weighting</p>
                  <p className="border-l-2 border-border bg-bg-primary p-2 text-[9px] font-medium italic text-text-secondary">{t.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-text-primary">
            <div className="h-4 w-1 bg-text-primary" /> 2. Telemetry Verification Log
          </h3>
          <div className="mb-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-bg-card-hover text-[9px] font-black uppercase tracking-widest text-text-primary">
                <tr>
                  <th className="p-3">Ticker</th>
                  <th className="p-3">Matrix State</th>
                  <th className="p-3">ROE %</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Intrinsic FV</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-bold">
                {marketData.map((s, i) => {
                  const st = getRadarStatus(s)
                  return (
                    <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-bg-card-hover">
                      <td className="p-3 font-black uppercase text-text-primary">{s.ticker}</td>
                      <td className="p-3">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${st.className}`}>{st.label}</span>
                      </td>
                      <td className="p-3 text-text-secondary">{s.roe || "N/A"}%</td>
                      <td className="p-3 font-mono text-text-primary">{s.price.toFixed(3)}</td>
                      <td className="p-3 font-mono text-text-secondary">{(s.ticker === "BOURSA" && s.eps ? s.eps * 22 : s.fv || 0).toFixed(3)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-[9px] font-black uppercase tracking-widest text-text-primary">Capital Footprint</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Invested</span>
                  <span className="font-black text-text-primary">{totalInvested.toFixed(3)} KD</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Equity</span>
                  <span className="font-black text-text-primary">{currentValue.toFixed(3)} KD</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-xs font-medium tracking-wider uppercase text-text-muted">Return</span>
                  <span className="font-black text-accent">{profitPercentage}%</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-bg-card-hover p-4">
              <h4 className="mb-2 text-[9px] font-black uppercase tracking-widest text-text-primary">Protocol Certification</h4>
              <p className="border-l-2 border-border pl-3 text-[9px] italic leading-relaxed text-text-secondary">
                &quot;Verification complete. Market overvaluation traps mitigated via Dividend Anti-Trap protocol.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
