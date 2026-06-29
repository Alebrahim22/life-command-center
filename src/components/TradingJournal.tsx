"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Trade {
  id: string
  instrument: string
  instrumentCustom: string
  direction: "Long" | "Short"
  entryPrice: number
  exitPrice: number | null
  lotSize: number
  stopLoss: number
  takeProfit: number
  status: "Open" | "Closed" | "Stopped Out"
  dateOpened: string
  dateClosed: string | null
  strategy: "Inside Bar" | "EMA Ribbon" | "Manual" | "Other"
  notes: string
}

const INSTRUMENTS = ["XAU/USD", "EUR/USD", "GBP/USD", "Custom"]
const STRATEGIES: Trade["strategy"][] = ["Inside Bar", "EMA Ribbon", "Manual", "Other"]

function today() {
  return new Date().toISOString().split("T")[0]
}

function contractSize(instrument: string): number {
  return instrument === "XAU/USD" ? 100 : 100000
}

function calcPnl(t: Trade): number | null {
  if (t.exitPrice === null) return null
  const diff = t.direction === "Long" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice
  const inst = t.instrument === "Custom" ? t.instrumentCustom : t.instrument
  return diff * t.lotSize * contractSize(inst)
}

function calcRR(t: Trade): number | null {
  if (t.stopLoss === t.entryPrice || t.takeProfit === t.entryPrice) return null
  let r, rLoss
  if (t.direction === "Long") {
    r = t.takeProfit - t.entryPrice
    rLoss = t.entryPrice - t.stopLoss
  } else {
    r = t.entryPrice - t.takeProfit
    rLoss = t.stopLoss - t.entryPrice
  }
  if (rLoss <= 0 || r <= 0) return null
  return r / rLoss
}

export default function TradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"All" | "Open" | "Closed">("All")
  const [showForm, setShowForm] = useState(false)

  const [instrument, setInstrument] = useState("XAU/USD")
  const [instrumentCustom, setInstrumentCustom] = useState("")
  const [direction, setDirection] = useState<"Long" | "Short">("Long")
  const [entryPrice, setEntryPrice] = useState("")
  const [exitPrice, setExitPrice] = useState("")
  const [lotSize, setLotSize] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [strategy, setStrategy] = useState<Trade["strategy"]>("Manual")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchTrades()
  }, [])

  async function fetchTrades() {
    const { data, error } = await supabase
      .from("trading_journal")
      .select("*")
      .order("date_opened", { ascending: false })

    if (error) {
      console.error("Failed to fetch trades:", error)
    } else if (data) {
      setTrades(
        data.map((r: any) => ({
          id: r.id,
          instrument: r.instrument,
          instrumentCustom: r.instrument_custom ?? "",
          direction: r.direction,
          entryPrice: Number(r.entry_price),
          exitPrice: r.exit_price !== null ? Number(r.exit_price) : null,
          lotSize: Number(r.lot_size),
          stopLoss: Number(r.stop_loss),
          takeProfit: Number(r.take_profit),
          status: r.status,
          dateOpened: r.date_opened,
          dateClosed: r.date_closed,
          strategy: r.strategy,
          notes: r.notes ?? "",
        })),
      )
    }
    setLoading(false)
  }

  async function addTrade() {
    const entry = parseFloat(entryPrice)
    const exit = exitPrice ? parseFloat(exitPrice) : null
    const lot = parseFloat(lotSize)
    const sl = parseFloat(stopLoss)
    const tp = parseFloat(takeProfit)
    if (isNaN(entry) || isNaN(lot) || isNaN(sl) || isNaN(tp)) return

    const isClosed = exit !== null

    const { data, error } = await supabase
      .from("trading_journal")
      .insert({
        instrument,
        instrument_custom: instrument === "Custom" ? instrumentCustom : "",
        direction,
        entry_price: entry,
        exit_price: exit,
        lot_size: lot,
        stop_loss: sl,
        take_profit: tp,
        status: isClosed ? "Closed" : "Open",
        date_closed: isClosed ? today() : null,
        strategy,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add trade:", error)
      return
    }

    setTrades((prev) => [
      {
        id: data.id,
        instrument: data.instrument,
        instrumentCustom: data.instrument_custom ?? "",
        direction: data.direction,
        entryPrice: Number(data.entry_price),
        exitPrice: data.exit_price !== null ? Number(data.exit_price) : null,
        lotSize: Number(data.lot_size),
        stopLoss: Number(data.stop_loss),
        takeProfit: Number(data.take_profit),
        status: data.status,
        dateOpened: data.date_opened,
        dateClosed: data.date_closed,
        strategy: data.strategy,
        notes: data.notes ?? "",
      },
      ...prev,
    ])
    setEntryPrice("")
    setExitPrice("")
    setLotSize("")
    setStopLoss("")
    setTakeProfit("")
    setNotes("")
    setShowForm(false)
  }

  async function closeTrade(id: string, status: "Closed" | "Stopped Out") {
    const trade = trades.find((t) => t.id === id)
    if (!trade) return

    const exit = trade.exitPrice ?? trade.entryPrice

    const { error } = await supabase
      .from("trading_journal")
      .update({ status, exit_price: exit, date_closed: today() })
      .eq("id", id)

    if (error) {
      console.error("Failed to close trade:", error)
      return
    }

    setTrades((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status, exitPrice: exit, dateClosed: today() } : t,
      ),
    )
  }

  async function deleteTrade(id: string) {
    const { error } = await supabase.from("trading_journal").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete trade:", error)
      return
    }
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = trades.filter((t) => {
    if (filter === "Open") return t.status === "Open"
    if (filter === "Closed") return t.status !== "Open"
    return true
  })

  const totalTrades = trades.length
  const closedTrades = trades.filter((t) => t.status !== "Open")
  const winningTrades = closedTrades.filter((t) => {
    const pnl = calcPnl(t)
    return pnl !== null && pnl > 0
  })
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

  const closedPnlValues = closedTrades.map(calcPnl).filter((p) => p !== null) as number[]
  const totalPnl = closedPnlValues.reduce((a, b) => a + b, 0)

  const rrValues = closedTrades.map(calcRR).filter((r) => r !== null) as number[]
  const avgRR = rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0

  const maxAbsPnl = Math.max(...closedPnlValues.map(Math.abs), 1)
  const MAX_EQUITY_BARS = 50
  const equityTrades = [...closedTrades].slice(-MAX_EQUITY_BARS)

  if (loading) {
    return (
      <div className="border border-white/[0.06] bg-zinc-900/30 backdrop-blur-md rounded-xl p-5 shadow-2xl shadow-black/40">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Trading Journal</h2>
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 border border-white/[0.06] bg-zinc-900/30 backdrop-blur-md rounded-xl p-5 shadow-2xl shadow-black/40 transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-secondary">Trading Journal</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
        >
          {showForm ? "Cancel" : "+ Trade"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Total Trades</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">{totalTrades}</p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Win Rate</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">{winRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Avg R:R</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">{avgRR.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-[10px] text-text-secondary">Total P&L</p>
          <p className={`mt-1 text-xl font-semibold ${totalPnl >= 0 ? "text-accent" : "text-red-400"}`}>
            ${totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {equityTrades.length > 0 && (
        <div className="mb-4 rounded-lg bg-bg-card-hover p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Equity Curve (last {equityTrades.length})</p>
          <div className="flex items-end gap-[2px]" style={{ height: 80 }}>
            {equityTrades.map((t) => {
              const pnl = calcPnl(t)!
              const h = Math.max(4, (Math.abs(pnl) / maxAbsPnl) * 100)
              return (
                <div
                  key={t.id}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: pnl >= 0 ? "var(--color-accent)" : "#ef4444",
                    opacity: 0.8,
                  }}
                  title={`${t.instrument === "Custom" ? t.instrumentCustom : t.instrument} ${t.direction}: $${pnl.toFixed(2)}`}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-1 rounded-lg bg-bg-card-hover p-1 text-xs">
        {(["All", "Open", "Closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-md px-3 py-1.5 capitalize transition-colors ${
              filter === f ? "bg-bg-card-hover text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {f} ({f === "All" ? trades.length : f === "Open" ? trades.filter((t) => t.status === "Open").length : trades.filter((t) => t.status !== "Open").length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-bg-card-hover p-3">
          <div className="flex gap-2">
            <select value={instrument} onChange={(e) => setInstrument(e.target.value)} className="rounded-lg border border-border bg-bg-card px-2 py-2 text-sm text-text-primary outline-none">
              {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {instrument === "Custom" && (
              <input type="text" placeholder="Instrument" value={instrumentCustom} onChange={(e) => setInstrumentCustom(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            )}
            <select value={direction} onChange={(e) => setDirection(e.target.value as "Long" | "Short")} className="rounded-lg border border-border bg-bg-card px-2 py-2 text-sm text-text-primary outline-none">
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Trade["strategy"])} className="rounded-lg border border-border bg-bg-card px-2 py-2 text-sm text-text-primary outline-none">
              {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="number" step="any" placeholder="Entry" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            <input type="number" step="any" placeholder="Exit (leave blank if open)" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            <input type="number" step="any" placeholder="Lot size" value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="w-20 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
          </div>
          <div className="flex gap-2">
            <input type="number" step="any" placeholder="Stop Loss" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            <input type="number" step="any" placeholder="Take Profit" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
          </div>
          <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" rows={2} />
          <button onClick={addTrade} className="w-full rounded-lg bg-accent/20 py-2 text-sm font-medium text-accent">Add Trade</button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-text-secondary">No trades yet</p>
      )}

      <div className="space-y-1">
        {filtered.map((t) => {
          const pnl = calcPnl(t)
          const rr = calcRR(t)
          const inst = t.instrument === "Custom" ? t.instrumentCustom : t.instrument
          return (
            <div
              key={t.id}
              className={`group rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-card-hover ${
                t.status === "Open" ? "border-l-2 border-accent bg-accent/5" : ""
              } ${t.status === "Stopped Out" ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${pnl !== null ? (pnl >= 0 ? "text-accent" : "text-red-400") : "text-text-primary"}`}>
                      {inst}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      t.direction === "Long" ? "bg-accent/20 text-accent" : "bg-red-500/20 text-red-400"
                    }`}>
                      {t.direction}
                    </span>
                    <span className="text-[10px] text-text-secondary">{t.dateOpened}</span>
                  </div>
                  <div className="mt-0.5 flex gap-3 text-[10px] text-text-secondary">
                    <span>Entry: {t.entryPrice}</span>
                    <span>SL: {t.stopLoss}</span>
                    <span>TP: {t.takeProfit}</span>
                    <span>Lot: {t.lotSize}</span>
                    {rr !== null && <span>R:R: {rr.toFixed(2)}</span>}
                    <span className="text-text-secondary">{t.strategy}</span>
                  </div>
                </div>

                <div className="text-right">
                  {pnl !== null ? (
                    <p className={`text-sm font-semibold ${pnl >= 0 ? "text-accent" : "text-red-400"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-amber-400">Open</p>
                  )}
                  <p className={`text-[10px] ${
                    t.status === "Closed" ? "text-accent" : t.status === "Stopped Out" ? "text-red-400" : "text-amber-400"
                  }`}>
                    {t.status}
                  </p>
                </div>

                {t.status === "Open" && (
                  <div className="flex gap-1">
                    <button onClick={() => closeTrade(t.id, "Closed")} className="rounded bg-accent/20 px-2 py-1 text-[10px] font-medium text-accent">Close</button>
                    <button onClick={() => closeTrade(t.id, "Stopped Out")} className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-medium text-red-400">SL</button>
                  </div>
                )}

                <button onClick={() => deleteTrade(t.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
              {t.notes && <p className="mt-1 text-[10px] text-text-secondary">{t.notes}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
