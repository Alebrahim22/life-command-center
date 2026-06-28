"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  TrendingUp, Shield, AlertCircle, FileText, Activity, Clock,
  ChevronRight, X, Briefcase, PieChart, Info, RefreshCw,
  Plus, Edit2, Trash2, Cpu, CheckCircle, History as HistoryIcon,
  Cloud, CloudOff, Download, FileDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

declare const html2canvas: any
declare global {
  interface Window {
    jspdf: any
  }
}

interface Holding {
  id?: string
  ticker: string
  shares: number
  avgPrice: number
  currentPrice: number
}

interface RadarStock {
  id?: string
  ticker: string
  name: string
  price: number
  fv: number | null
  eps: number | null
  roe: number | null
  yield: number | null
  specialFlag?: string | null
  news?: string | null
  sentimentApplied?: boolean
  upcomingDividend?: boolean
}

interface Order {
  id?: string
  date: string
  time: string
  ticker: string
  shares: number
  price: number
  total: number
}

const colors = ["bg-accent", "bg-blue-500", "bg-purple-500", "bg-amber-500"]

export default function OsoulArchitect() {
  const [myHoldings, setMyHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Order[]>([])
  const [marketData, setMarketData] = useState<RadarStock[]>([])
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [activeTab, setActiveTab] = useState("allocation")
  const [isRunning, setIsRunning] = useState(false)
  const [hasExecuted, setHasExecuted] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const [monthlyCapital, setMonthlyCapital] = useState(300)

  const [showStockModal, setShowStockModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [stockForm, setStockForm] = useState({ ticker: "", shares: "", avgPrice: "", currentPrice: "" })

  const [showRadarModal, setShowRadarModal] = useState(false)
  const [editRadarIndex, setEditRadarIndex] = useState<number | null>(null)
  const [radarForm, setRadarForm] = useState({
    ticker: "", name: "", price: "", fv: "", eps: "", roe: "", yield: "", upcomingDividend: false,
  })

  const currentMonthYear = new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })

  useEffect(() => {
    fetchAllData()

    const load = (src: string) =>
      new Promise<void>((res) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return }
        const s = document.createElement("script")
        s.src = src
        s.onload = () => res()
        document.head.appendChild(s)
      })
    Promise.all([
      load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
      load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
    ])
  }, [])

  async function fetchAllData() {
    const { data: boursaPlat } = await supabase
      .from("portfolio_platforms")
      .select("id")
      .eq("name", "Kuwait Boursa")
      .single()

    const boursaId = boursaPlat?.id ?? ""

    const [radarRes, holdRes, ordersRes] = await Promise.all([
      supabase.from("market_radar").select("*"),
      supabase.from("portfolio_holdings")
        .select("id, asset, quantity, buy_price, current_price")
        .eq("platform_id", boursaId),
      supabase.from("portfolio_orders").select("*").order("executed_at", { ascending: false }),
    ])

    if (radarRes.data) {
      setMarketData(
        radarRes.data.map((r: any) => ({
          id: r.id,
          ticker: r.ticker,
          name: r.name,
          price: Number(r.price),
          fv: r.fv ? Number(r.fv) : null,
          eps: r.eps ? Number(r.eps) : null,
          roe: r.roe ? Number(r.roe) : null,
          yield: r.yield ? Number(r.yield) : null,
          specialFlag: r.special_flag,
          news: r.news,
          sentimentApplied: r.sentiment_applied,
          upcomingDividend: r.upcoming_dividend,
        })),
      )
    }

    if (holdRes.data) {
      setMyHoldings(
        holdRes.data.map((h: any) => ({
          id: h.id,
          ticker: h.asset,
          shares: Number(h.quantity),
          avgPrice: Number(h.buy_price),
          currentPrice: Number(h.current_price),
        })),
      )
    }

    if (ordersRes.data) {
      setTransactions(
        ordersRes.data.map((o: any) => {
          const d = new Date(o.executed_at)
          return {
            id: o.id,
            date: d.toLocaleDateString("en-GB"),
            time: d.toLocaleTimeString("en-GB"),
            ticker: o.ticker,
            shares: o.shares,
            price: Number(o.price),
            total: Number(o.total),
          }
        }),
      )
    }

    setLoading(false)
  }

  const totalInvested = useMemo(
    () => myHoldings.reduce((sum, item) => sum + item.shares * item.avgPrice, 0),
    [myHoldings],
  )

  const currentValue = useMemo(
    () => myHoldings.reduce((sum, item) => sum + item.shares * item.currentPrice, 0),
    [myHoldings],
  )

  const totalProfit = currentValue - totalInvested
  const profitPercentage = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : "0"

  const allocationResult = useMemo(() => {
    const tier1: any[] = []
    const tier2: any[] = []
    let highestYieldStock: any = null
    const traps: any[] = []

    marketData.forEach((stock) => {
      let fv = stock.fv
      let pe: number | null = null

      if (stock.ticker === "BOURSA" && stock.eps) {
        fv = 22 * stock.eps
        pe = stock.price / stock.eps
      }
      if (!fv) return

      const discount = (fv - stock.price) / fv

      if (stock.upcomingDividend && discount < -0.05) {
        traps.push({ ...stock, trapReason: "Dividend Trap: Current Premium is excessive for payout safety." })
        return
      }

      if (stock.yield && (!highestYieldStock || stock.yield > highestYieldStock.yield)) {
        highestYieldStock = stock
      }

      if (stock.roe && stock.roe >= 15) {
        let score = 0
        let tier = 0

        if (discount >= 0.1) {
          score = stock.roe * discount
          tier = 1
        } else if (discount > -0.1 && discount < 0.1) {
          score = stock.roe
          tier = 2
        }

        if (stock.ticker === "BOURSA" && pe !== null && pe < 18) {
          ;(stock as any).highPriority = true
          if (tier === 1) score *= 1.5
        }

        if (tier > 0 && stock.news) {
          score *= 1.1
          ;(stock as any).sentimentApplied = true
        }

        if (tier === 1) {
          tier1.push({ ...stock, discount: (discount * 100).toFixed(1), score, fv })
        } else if (tier === 2) {
          tier2.push({ ...stock, premium: Math.abs(discount * 100).toFixed(1), score, fv })
        }
      }
    })

    let targets: any[] = []
    let activeTier = ""
    let description = ""
    let isDefensive = false

    if (tier1.length > 0) {
      activeTier = "Tier 1: Deep Value Compounders"
      description = `Detected ${tier1.length} high-conviction assets with >10% MoS. Weighted by (ROE x Discount).`
      const total = tier1.reduce((sum, s) => sum + s.score, 0)
      targets = tier1.map((s) => ({
        ...s,
        weight: (s.score / total) * 100,
        allocation: (s.score / total) * monthlyCapital,
        reason: s.highPriority ? "High Priority P/E Accumulation" : `ROE: ${s.roe}% | Disc: ${s.discount}%`,
      }))
    } else if (tier2.length > 0) {
      activeTier = "Tier 2: GARP (Fairly Valued)"
      description = "No deep value found. Allocation conviction weighted by absolute ROE efficiency."
      const total = tier2.reduce((sum, s) => sum + s.score, 0)
      targets = tier2.map((s) => ({
        ...s,
        weight: (s.score / total) * 100,
        allocation: (s.score / total) * monthlyCapital,
        reason: `ROE: ${s.roe}% | Prem: ${s.premium}%`,
      }))
    } else if (highestYieldStock) {
      activeTier = "Tier 3: Defensive Cash Shield"
      description = "Market broadly overvalued. Routing 100% to safest top yield play."
      isDefensive = true
      targets = [{ ...highestYieldStock, weight: 100, allocation: monthlyCapital, reason: `Yield: ${highestYieldStock.yield}%` }]
    }

    targets.sort((a, b) => b.allocation - a.allocation)
    return { activeTier, description, targets, isDefensive, traps }
  }, [marketData, monthlyCapital])

  function getRadarStatus(stock: RadarStock) {
    let fv = stock.fv
    let pe: number | null = null

    if (stock.ticker === "BOURSA" && stock.eps) {
      fv = 22 * stock.eps
      pe = stock.price / stock.eps
    }
    if (!fv || !stock.roe) return { label: "Hold / Watch", className: "bg-bg-card-hover text-text-secondary" }

    const disc = (fv - stock.price) / fv

    if (stock.upcomingDividend && disc < -0.05)
      return { label: "Dividend Trap", className: "bg-red-500/20 text-red-400 font-bold" }
    if (stock.ticker === "BOURSA" && pe !== null && pe < 18)
      return { label: "Accumulate (P/E < 18)", className: "bg-accent/30 text-accent font-bold" }
    if (stock.roe >= 15 && disc >= 0.1)
      return { label: "Tier 1 (Buy)", className: "bg-accent/20 text-accent font-bold" }
    if (stock.roe >= 15 && disc > -0.1)
      return { label: "Tier 2 (Buy)", className: "bg-blue-500/20 text-blue-400 font-bold" }
    if (stock.roe >= 15)
      return { label: "Overvalued", className: "bg-red-500/20 text-red-400" }

    return { label: "Low Quality", className: "bg-orange-500/20 text-orange-400" }
  }

  async function executeOrders() {
    if (hasExecuted) return

    const updatedHoldings = [...myHoldings]
    const newOrders: Order[] = []

    for (const target of allocationResult.targets) {
      const shares = Math.floor(target.allocation / target.price)
      if (shares <= 0) continue

      const spent = shares * target.price
      const now = new Date()

      const { error: orderErr } = await supabase.from("portfolio_orders").insert({
        ticker: target.ticker,
        shares,
        price: target.price,
        total: spent,
      })

      if (orderErr) {
        console.error("Failed to insert order:", orderErr)
        continue
      }

      newOrders.push({
        date: now.toLocaleDateString("en-GB"),
        time: now.toLocaleTimeString("en-GB"),
        ticker: target.ticker,
        shares,
        price: target.price,
        total: spent,
      })

      const idx = updatedHoldings.findIndex(
        (h) => h.ticker === target.ticker || (target.ticker === "MEZZ" && h.ticker === "MEZZAN"),
      )

      if (idx >= 0) {
        const oldCost = updatedHoldings[idx].shares * updatedHoldings[idx].avgPrice
        const newShares = updatedHoldings[idx].shares + shares
        updatedHoldings[idx] = {
          ...updatedHoldings[idx],
          shares: newShares,
          avgPrice: (oldCost + spent) / newShares,
          currentPrice: target.price,
        }

        if (updatedHoldings[idx].id) {
          await supabase
            .from("portfolio_holdings")
            .update({
              quantity: newShares,
              buy_price: (oldCost + spent) / newShares,
              current_price: target.price,
            })
            .eq("id", updatedHoldings[idx].id)
        }
      } else {
        let platId = ""
        const { data: plat } = await supabase
          .from("portfolio_platforms")
          .select("id")
          .eq("name", "Kuwait Boursa")
          .single()
        if (plat) platId = plat.id

        const { data: newHolding } = await supabase
          .from("portfolio_holdings")
          .insert({
            platform_id: platId,
            asset: target.ticker,
            quantity: shares,
            buy_price: target.price,
            current_price: target.price,
          })
          .select()
          .single()

        if (newHolding) {
          updatedHoldings.push({
            id: newHolding.id,
            ticker: target.ticker,
            shares,
            avgPrice: target.price,
            currentPrice: target.price,
          })
        }
      }
    }

    setMyHoldings(updatedHoldings)
    setTransactions((prev) => [...newOrders, ...prev])
    setHasExecuted(true)
  }

  async function handleSaveStock(e: React.FormEvent) {
    e.preventDefault()
    const p: Holding = {
      ticker: stockForm.ticker.toUpperCase(),
      shares: Number(stockForm.shares),
      avgPrice: Number(stockForm.avgPrice),
      currentPrice: Number(stockForm.currentPrice),
    }

    if (editIndex !== null) {
      const existing = myHoldings[editIndex]
      if (existing.id) {
        await supabase
          .from("portfolio_holdings")
          .update({ asset: p.ticker, quantity: p.shares, buy_price: p.avgPrice, current_price: p.currentPrice })
          .eq("id", existing.id)
      }
      const updated = myHoldings.map((h, i) => (i === editIndex ? { ...h, ...p } : h))
      setMyHoldings(updated)
    } else {
      const { data: plat } = await supabase
        .from("portfolio_platforms")
        .select("id")
        .eq("name", "Kuwait Boursa")
        .single()
      let platId = ""
      if (plat) platId = plat.id

      const { data: inserted } = await supabase
        .from("portfolio_holdings")
        .insert({ platform_id: platId, asset: p.ticker, quantity: p.shares, buy_price: p.avgPrice, current_price: p.currentPrice })
        .select()
        .single()

      if (inserted) {
        setMyHoldings((prev) => [...prev, { id: inserted.id, ...p }])
      } else {
        setMyHoldings((prev) => [...prev, p])
      }
    }

    setShowStockModal(false)
  }

  async function handleSaveRadar(e: React.FormEvent) {
    e.preventDefault()
    const p = {
      ticker: radarForm.ticker.toUpperCase(),
      name: radarForm.name,
      price: Number(radarForm.price),
      fv: radarForm.fv ? Number(radarForm.fv) : null,
      eps: radarForm.eps ? Number(radarForm.eps) : null,
      roe: radarForm.roe ? Number(radarForm.roe) : null,
      yield: radarForm.yield ? Number(radarForm.yield) : null,
      upcomingDividend: radarForm.upcomingDividend,
    }

    if (editRadarIndex !== null) {
      const existing = marketData[editRadarIndex]
      if (existing.id) {
        await supabase
          .from("market_radar")
          .update({
            ticker: p.ticker,
            name: p.name,
            price: p.price,
            fv: p.fv,
            eps: p.eps,
            roe: p.roe,
            yield: p.yield,
            upcoming_dividend: p.upcomingDividend,
          })
          .eq("id", existing.id)
      }
      const updated = marketData.map((s, i) =>
        i === editRadarIndex ? { ...s, ...p, specialFlag: s.specialFlag, news: s.news } : s,
      )
      setMarketData(updated)
    } else {
      const { data: inserted } = await supabase
        .from("market_radar")
        .insert({
          ticker: p.ticker,
          name: p.name,
          price: p.price,
          fv: p.fv,
          eps: p.eps,
          roe: p.roe,
          yield: p.yield,
          upcoming_dividend: p.upcomingDividend,
        })
        .select()
        .single()

      if (inserted) {
        setMarketData((prev) => [
          ...prev,
          {
            id: inserted.id,
            ticker: inserted.ticker,
            name: inserted.name,
            price: Number(inserted.price),
            fv: inserted.fv ? Number(inserted.fv) : null,
            eps: inserted.eps ? Number(inserted.eps) : null,
            roe: inserted.roe ? Number(inserted.roe) : null,
            yield: inserted.yield ? Number(inserted.yield) : null,
            specialFlag: inserted.special_flag,
            news: inserted.news,
            sentimentApplied: inserted.sentiment_applied,
            upcomingDividend: inserted.upcoming_dividend,
          },
        ])
      }
    }

    setShowRadarModal(false)
  }

  async function deleteHolding(idx: number) {
    const holding = myHoldings[idx]
    if (holding.id) {
      await supabase.from("portfolio_holdings").delete().eq("id", holding.id)
    }
    setMyHoldings((prev) => prev.filter((_, i) => i !== idx))
  }

  const exportPDF = async () => {
    if (!reportRef.current || typeof html2canvas === "undefined") return
    setIsExportingPDF(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const { jsPDF } = window.jspdf
      const pdf = new jsPDF("p", "mm", "a4")
      pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width)
      pdf.save(`Architect_Report_${currentMonthYear.replace(/\s/g, "_")}.pdf`)
    } catch (e) {
      console.error("PDF export failed", e)
    } finally {
      setIsExportingPDF(false)
    }
  }

  function downloadMonthlyReport() {
    let content = `====================================================\n`
    content += `        OSOUL ARCHITECT OS - MONTHLY REPORT\n`
    content += `        Date: ${currentMonthYear}\n`
    content += `====================================================\n\n`
    content += `[1] PORTFOLIO SUMMARY\n`
    content += `----------------------------------------------------\n`
    content += `Total Invested: ${totalInvested.toFixed(3)} KD\n`
    content += `Current Value:  ${currentValue.toFixed(3)} KD\n`
    content += `Net Return:     ${totalProfit.toFixed(3)} KD (${profitPercentage}%)\n\n`
    content += `[2] THIS MONTH SUGGESTIONS\n`
    content += `----------------------------------------------------\n`
    content += `Tier: ${allocationResult.activeTier}\n`
    allocationResult.targets.forEach((t: any) => {
      content += `-> ${t.ticker}: ${t.allocation.toFixed(3)} KD | Rationale: ${t.reason}\n`
    })
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Architect_Report_${currentMonthYear.replace(/\s/g, "_")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Osoul Architect OS</h2>
        <div className="h-48 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-text-primary italic">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-text-primary">
              <span className="text-xl font-bold text-accent">O</span>
            </div>
            Osoul Architect OS
          </h1>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            <span className="flex items-center gap-1 text-accent"><Cloud size={14} /> Broker Live</span>
            <span className="text-border">|</span>
            <span>{currentMonthYear}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={downloadMonthlyReport} className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-[11px] font-bold text-text-primary transition-colors hover:bg-bg-card-hover">
            <Download size={16} className="text-accent" /> Export
          </button>
          <button onClick={() => setShowReport(true)} className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-[11px] font-bold text-text-primary transition-colors hover:bg-bg-card-hover">
            <FileText size={16} className="text-text-secondary" /> Report
          </button>
          <button
            onClick={() => { setIsRunning(true); setTimeout(() => { setIsRunning(false); setHasExecuted(false) }, 1500) }}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold transition-all ${
              isRunning ? "cursor-wait bg-bg-card-hover text-amber-400" : "bg-text-primary text-accent hover:bg-text-primary/90"
            }`}
          >
            {isRunning ? <Cpu size={16} className="animate-pulse" /> : <RefreshCw size={16} />}
            {isRunning ? "Recalculating..." : "Start New Month"}
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {(["allocation", "portfolio", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                activeTab === tab ? "border-accent text-text-primary" : "border-transparent text-text-secondary"
              }`}
            >
              {tab === "allocation" && <Activity size={14} />}
              {tab === "portfolio" && <Briefcase size={14} />}
              {tab === "history" && <HistoryIcon size={14} />}
              {tab === "allocation" ? `Allocation (${monthlyCapital} KD)` : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* --- ALLOCATION TAB --- */}
      {activeTab === "allocation" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Capital Input */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-4">
              <div>
                <h3 className="text-[10px] font-black uppercase text-text-primary">Deployment Capital</h3>
                <p className="text-[9px] font-bold uppercase text-text-secondary">Budget: {currentMonthYear}</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-bg-card-hover p-1">
                <input
                  type="number"
                  value={monthlyCapital}
                  onChange={(e) => setMonthlyCapital(Number(e.target.value))}
                  className="w-24 bg-transparent pr-1 text-right font-black text-text-primary outline-none"
                />
                <span className="pr-1 text-[10px] font-black text-text-secondary">KD</span>
              </div>
            </div>

            {/* Allocation Card */}
            <div className="rounded-xl border border-border border-t-4 border-t-text-primary bg-bg-card">
              <div className="p-6">
                <span className={`inline-block rounded-sm border px-2 py-1 text-[9px] font-black uppercase tracking-tighter ${
                  allocationResult.isDefensive
                    ? "border-purple-500/30 bg-purple-500/20 text-purple-400"
                    : "border-accent/30 bg-accent/20 text-accent"
                }`}>
                  {allocationResult.activeTier}
                </span>
                <h2 className="mt-3 text-xl font-bold text-text-primary">Dynamic Conviction Routing</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{allocationResult.description}</p>

                <div className="my-6">
                  <div className="flex h-3 w-full overflow-hidden rounded-full border bg-bg-card-hover shadow-inner">
                    {allocationResult.targets.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className={`h-full transition-all duration-700 ${colors[idx % colors.length]}`}
                        style={{ width: `${t.weight}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {allocationResult.targets.map((t: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-border bg-bg-card-hover p-4 transition-colors hover:border-accent/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${colors[idx % colors.length]}`} />
                            <h3 className="text-[10px] font-black uppercase text-text-primary">{t.ticker}</h3>
                          </div>
                          <p className="mt-0.5 text-[9px] font-bold text-text-secondary">Weight: {t.weight.toFixed(1)}%</p>
                        </div>
                        <span className="border-b-2 border-accent text-lg font-black text-text-primary">{t.allocation.toFixed(1)} KD</span>
                      </div>
                      <p className="mt-3 flex items-center gap-1 text-[9px] font-bold italic text-text-secondary">
                        <Info size={10} /> {t.reason}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end border-t border-border pt-5">
                  <button
                    onClick={executeOrders}
                    disabled={hasExecuted}
                    className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                      hasExecuted
                        ? "border border-accent/30 bg-accent/10 text-accent"
                        : "bg-text-primary text-accent shadow-xl active:scale-95"
                    }`}
                  >
                    {hasExecuted ? <CheckCircle size={16} /> : <Cpu size={16} />}
                    {hasExecuted ? "Position Logged" : "Execute Approved Orders"}
                  </button>
                </div>
              </div>
            </div>

            {/* Market Radar Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-primary">
                    <Activity size={14} className="text-accent" /> Market Radar Telemetry
                  </h2>
                  <button
                    onClick={() => { setRadarForm({ ticker: "", name: "", price: "", fv: "", eps: "", roe: "", yield: "", upcomingDividend: false }); setEditRadarIndex(null); setShowRadarModal(true) }}
                    className="rounded border border-border p-1.5 text-[9px] font-black uppercase transition-colors hover:bg-bg-card-hover"
                  >
                    <Plus size={10} className="mr-1 inline" /> Monitor Asset
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-[9px] font-black uppercase tracking-tighter text-text-secondary">
                        <th className="pb-3 pr-2">Asset</th>
                        <th className="pb-3 pr-2">Price / FV</th>
                        <th className="pb-3 pr-2">ROE / Yield</th>
                        <th className="pb-3 pr-2">Status</th>
                        <th className="pb-3 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {marketData.map((s, i) => {
                        const st = getRadarStatus(s)
                        return (
                          <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-bg-card-hover group">
                            <td className="py-3 pr-2 font-black text-text-primary">
                              {s.ticker}<br />
                              <span className="text-[9px] font-bold text-text-secondary">{s.name}</span>
                            </td>
                            <td className="py-3 pr-2 font-bold text-text-primary">
                              {s.price.toFixed(3)}<br />
                              <span className="text-[9px] text-text-secondary">
                                FV: {s.ticker === "BOURSA" && s.eps ? (s.eps * 22).toFixed(3) : s.fv?.toFixed(3) || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 pr-2 font-bold">
                              {s.roe ? <span className={s.roe >= 15 ? "text-accent" : "text-text-primary"}>{s.roe}%</span> : "-"}
                              <br />
                              {s.yield ? (
                                <span className="text-[9px] font-black text-amber-400">Y: {s.yield}%</span>
                              ) : s.news ? (
                                <span className="text-[9px] font-black italic text-blue-400">News</span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="py-3 pr-2">
                              <span className={`rounded-sm px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${st.className}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setRadarForm({
                                    ticker: s.ticker, name: s.name, price: String(s.price),
                                    fv: s.fv ? String(s.fv) : "", eps: s.eps ? String(s.eps) : "",
                                    roe: s.roe ? String(s.roe) : "", yield: s.yield ? String(s.yield) : "",
                                    upcomingDividend: s.upcomingDividend || false,
                                  })
                                  setEditRadarIndex(i)
                                  setShowRadarModal(true)
                                }}
                                className="p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Edit2 size={11} className="text-text-secondary" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 md:grid-cols-2">
                  <div className="flex gap-2">
                    <span className="h-fit whitespace-nowrap rounded bg-accent/20 px-1.5 py-0.5 text-[8px] font-black text-accent">Tier 1</span>
                    <p className="text-[9px] font-bold leading-tight text-text-secondary">Deep Value. High ROE (&gt;15%) and Price is &gt;10% below intrinsic Fair Value.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-fit whitespace-nowrap rounded bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-black text-blue-400">Tier 2</span>
                    <p className="text-[9px] font-bold leading-tight text-text-secondary">GARP. High ROE trading within fair value range (±10% premium).</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-fit whitespace-nowrap rounded bg-red-500/20 px-1.5 py-0.5 text-[8px] font-black text-red-400">Overvalued</span>
                    <p className="text-[9px] font-bold leading-tight text-text-secondary">Price exceeds 10% premium ceiling. Matrix refuses allocation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-border bg-bg-card-hover p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/5 blur-3xl" />
              <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                <PieChart size={13} /> 5-Year Dynamics
              </h2>
              <div className="relative z-10 space-y-4">
                {allocationResult.targets.map((t: any, idx: number) => {
                  const projectionValue = !t.roe || allocationResult.isDefensive
                    ? t.allocation * (t.yield / 100) * 5
                    : t.allocation * Math.pow(1.15, 5)
                  return (
                    <div key={idx} className={`border-l-2 pl-3 ${idx % 2 === 0 ? "border-accent" : "border-purple-500"}`}>
                      <p className="text-[9px] font-black uppercase text-text-secondary">{t.ticker} Projection</p>
                      <p className="text-lg font-black text-text-primary">~{projectionValue.toFixed(0)} KD</p>
                      <p className="text-[8px] font-bold italic text-text-secondary">
                        {!t.roe ? "Income Yield" : "15% Intrinsic CAGR"}
                      </p>
                    </div>
                  )
                })}
                <div className="border-t border-border pt-3">
                  <p className="text-center text-[9px] font-black uppercase text-text-secondary">Wealth Injection Prediction</p>
                  <p className="mt-1 text-center text-xl font-black text-accent">
                    ~{allocationResult.targets.reduce((acc: number, t: any) => {
                      return acc + (!t.roe || allocationResult.isDefensive
                        ? t.allocation * (t.yield / 100) * 5 + t.allocation
                        : t.allocation * Math.pow(1.15, 5))
                    }, 0).toFixed(0)} KD
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                <AlertCircle size={13} /> Architect Intel
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <ChevronRight size={12} className="shrink-0 text-accent" />
                  <p className="text-[9px] font-bold leading-relaxed text-text-secondary">
                    <strong className="text-text-primary">KFH Moat Integration:</strong> Holding price matched at 0.771 KD. Yield compounds safely below Graham FV.
                  </p>
                </li>
                <li className="flex gap-2">
                  <ChevronRight size={12} className="shrink-0 text-accent" />
                  <p className="text-[9px] font-bold leading-relaxed text-text-secondary">
                    <strong className="text-text-primary">Mabanee Co added:</strong> Now evaluating property sector weightings under conservative valuation thresholds.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* --- PORTFOLIO TAB --- */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-card p-5">
              <p className="text-[9px] font-black uppercase text-text-secondary">Capital Invested</p>
              <p className="text-2xl font-black text-text-primary">{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 3 })} KD</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-5">
              <p className="text-[9px] font-black uppercase text-text-secondary">Current Value</p>
              <p className="text-2xl font-black text-text-primary">{currentValue.toLocaleString(undefined, { minimumFractionDigits: 3 })} KD</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-bg-card p-5">
              <p className="text-[9px] font-black uppercase text-accent">Total Net Profit</p>
              <p className={`text-2xl font-black ${totalProfit >= 0 ? "text-accent" : "text-red-400"}`}>
                {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 3 })} KD ({profitPercentage}%)
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <div className="flex items-center justify-between border-b border-border bg-bg-card-hover p-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Active Inventory</h2>
              <button
                onClick={() => { setStockForm({ ticker: "", shares: "", avgPrice: "", currentPrice: "" }); setEditIndex(null); setShowStockModal(true) }}
                className="rounded-sm bg-accent/20 px-2.5 py-1.5 text-[9px] font-black uppercase text-accent"
              >
                + New Asset
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[9px] font-black uppercase text-text-secondary">
                    <th className="p-4">Asset</th>
                    <th className="p-4">Shares</th>
                    <th className="p-4">Avg Price</th>
                    <th className="p-4">Market Price</th>
                    <th className="p-4">Total Val</th>
                    <th className="p-4">Net P/L</th>
                    <th className="p-4 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {myHoldings.map((h, idx) => {
                    const cost = h.shares * h.avgPrice
                    const val = h.shares * h.currentPrice
                    const pl = val - cost
                    const plP = cost > 0 ? ((pl / cost) * 100).toFixed(2) : "0"
                    return (
                      <tr key={idx} className="border-b border-border last:border-0 transition-colors hover:bg-bg-card-hover group">
                        <td className="p-4 font-black text-text-primary">{h.ticker}</td>
                        <td className="p-4 font-bold text-text-primary">{h.shares.toLocaleString()}</td>
                        <td className="p-4 font-bold text-text-primary">{h.avgPrice.toFixed(4)}</td>
                        <td className="p-4 font-black text-text-primary">{h.currentPrice.toFixed(3)}</td>
                        <td className="p-4 font-black text-text-primary">{val.toFixed(3)}</td>
                        <td className={`p-4 font-black ${pl >= 0 ? "text-accent" : "text-red-400"}`}>
                          {pl >= 0 ? "+" : ""}{pl.toFixed(3)}<br />
                          <span className="text-[9px]">({plP}%)</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setStockForm({ ticker: h.ticker, shares: String(h.shares), avgPrice: String(h.avgPrice), currentPrice: String(h.currentPrice) }); setEditIndex(idx); setShowStockModal(true) }}
                              className="p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Edit2 size={11} className="text-text-secondary" />
                            </button>
                            <button
                              onClick={() => deleteHolding(idx)}
                              className="p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 size={11} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY TAB --- */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h2 className="mb-5 text-[10px] font-black uppercase tracking-widest text-text-primary">Execution Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-border text-[9px] font-black uppercase text-text-secondary">
                  <th className="pb-3 pr-3">Timestamp</th>
                  <th className="pb-3 pr-3">Asset</th>
                  <th className="pb-3 pr-3">Size</th>
                  <th className="pb-3 pr-3">Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 transition-colors hover:bg-bg-card-hover">
                    <td className="py-3 pr-3 font-bold text-text-secondary">{tx.date} {tx.time}</td>
                    <td className="py-3 pr-3 font-black text-text-primary">{tx.ticker}</td>
                    <td className="py-3 pr-3 font-bold text-text-primary">{tx.shares}</td>
                    <td className="py-3 pr-3 font-bold text-text-primary">{tx.price.toFixed(3)}</td>
                    <td className="py-3 text-right font-black text-text-primary">{tx.total.toFixed(3)} KD</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[11px] text-text-secondary">No orders executed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- RADAR MODAL --- */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-bold text-text-primary">{editRadarIndex !== null ? "Modify Radar" : "New Radar Asset"}</h2>
              <button onClick={() => setShowRadarModal(false)}><X size={18} className="text-text-secondary" /></button>
            </div>
            <form onSubmit={handleSaveRadar} className="space-y-3 p-4">
              <input required placeholder="Ticker" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.ticker} onChange={(e) => setRadarForm({ ...radarForm, ticker: e.target.value })} />
              <input required placeholder="Name" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.name} onChange={(e) => setRadarForm({ ...radarForm, name: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" step="0.001" placeholder="Price" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.price} onChange={(e) => setRadarForm({ ...radarForm, price: e.target.value })} />
                <input type="number" step="0.001" placeholder="FV" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.fv} onChange={(e) => setRadarForm({ ...radarForm, fv: e.target.value })} />
                <input type="number" step="0.001" placeholder="EPS" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.eps} onChange={(e) => setRadarForm({ ...radarForm, eps: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.1" placeholder="ROE %" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.roe} onChange={(e) => setRadarForm({ ...radarForm, roe: e.target.value })} />
                <input type="number" step="0.1" placeholder="Yield %" className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={radarForm.yield} onChange={(e) => setRadarForm({ ...radarForm, yield: e.target.value })} />
              </div>
              <button type="submit" className="w-full rounded-lg bg-text-primary py-2.5 text-[10px] font-black uppercase tracking-widest text-accent">
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- STOCK MODAL --- */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-bold text-text-primary">{editIndex !== null ? "Modify Holding" : "New Asset"}</h2>
              <button onClick={() => setShowStockModal(false)}><X size={18} className="text-text-secondary" /></button>
            </div>
            <form onSubmit={handleSaveStock} className="space-y-3 p-4">
              <input required placeholder="Ticker" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={stockForm.ticker} onChange={(e) => setStockForm({ ...stockForm, ticker: e.target.value })} />
              <input required type="number" placeholder="Shares" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={stockForm.shares} onChange={(e) => setStockForm({ ...stockForm, shares: e.target.value })} />
              <input required type="number" step="0.001" placeholder="Avg Price" className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary" value={stockForm.avgPrice} onChange={(e) => setStockForm({ ...stockForm, avgPrice: e.target.value })} />
              <button type="submit" className="w-full rounded-lg bg-text-primary py-2.5 text-[10px] font-black uppercase tracking-widest text-accent">
                Commit Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-card-hover p-4">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                <FileText size={15} /> Engineering Intelligence
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportPDF}
                  disabled={isExportingPDF}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase transition-colors ${
                    isExportingPDF ? "cursor-wait opacity-50" : ""
                  } bg-accent/20 text-accent hover:bg-accent/30`}
                >
                  {isExportingPDF ? <RefreshCw className="animate-spin" size={13} /> : <FileDown size={13} />}
                  {isExportingPDF ? "Baking PDF..." : "Download PDF"}
                </button>
                <button onClick={() => setShowReport(false)}><X size={18} className="text-text-secondary" /></button>
              </div>
            </div>
            <div ref={reportRef} className="overflow-y-auto bg-bg-primary p-8">
              {/* Report Header */}
              <div className="mb-6 flex items-start justify-between border-b-2 border-text-primary pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-text-primary">
                    <span className="text-2xl font-bold text-accent">O</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-black uppercase italic tracking-tight text-text-primary">Architect Intelligence Ledger</h1>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Osoul Portfolio Optimization Framework</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-text-secondary">Filing Period</p>
                  <p className="text-base font-black text-text-primary">{currentMonthYear}</p>
                </div>
              </div>

              {/* Section 1 */}
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
                      <p className="mb-1 text-[8px] font-black uppercase text-text-secondary">{t.weight.toFixed(1)}% Weighting</p>
                      <p className="border-l-2 border-border bg-bg-primary p-2 text-[9px] font-medium italic text-text-secondary">{t.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 */}
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
                          <td className="p-3 font-mono text-text-secondary">
                            {(s.ticker === "BOURSA" && s.eps ? s.eps * 22 : s.fv || 0).toFixed(3)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3 */}
              <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-[9px] font-black uppercase tracking-widest text-text-primary">Capital Footprint</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-[10px] font-bold uppercase text-text-secondary">Invested</span>
                      <span className="font-black text-text-primary">{totalInvested.toFixed(3)} KD</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-[10px] font-bold uppercase text-text-secondary">Equity</span>
                      <span className="font-black text-text-primary">{currentValue.toFixed(3)} KD</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-[10px] font-bold uppercase text-text-secondary">Return</span>
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
      )}
    </div>
  )
}
