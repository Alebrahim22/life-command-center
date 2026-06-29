"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Holding {
  id: string
  platformId: string
  asset: string
  quantity: number
  buyPrice: number
  currentPrice: number
}

interface PlatformInfo {
  id: string
  name: string
  changeToday: number
  usdToKwd: number
  holdings: Holding[]
}

type PortfolioData = Record<string, PlatformInfo>

const PLATFORM_NAMES = ["Binance", "Kuwait Boursa", "eToro"] as const
type PlatformName = (typeof PLATFORM_NAMES)[number]

const PLATFORM_LABELS: Record<string, string> = {
  binance: "Binance",
  kuwaitBoursa: "Kuwait Boursa",
  eToro: "eToro",
}

function fmt(n: number, currency: "USD" | "KWD"): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: currency === "KWD" ? 3 : 2,
    maximumFractionDigits: currency === "KWD" ? 3 : 2,
  })
}

export default function PortfolioTracker() {
  const [platforms, setPlatforms] = useState<PortfolioData>({})
  const [loaded, setLoaded] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [rateInput, setRateInput] = useState("0.307")

  const [addingPlatform, setAddingPlatform] = useState<string | null>(null)
  const [addAsset, setAddAsset] = useState("")
  const [addQty, setAddQty] = useState("")
  const [addBuy, setAddBuy] = useState("")
  const [addCur, setAddCur] = useState("")

  // ── Load from Supabase ──
  useEffect(() => {
    Promise.all([
      supabase.from("portfolio_platforms").select("*"),
      supabase.from("portfolio_holdings").select("*"),
    ]).then(([platRes, holdRes]) => {
      const map: PortfolioData = {}
      const platRows = platRes.data || []
      const holdRows = holdRes.data || []

      for (const p of platRows) {
        const key = PLATFORM_NAMES.find((n) => n === p.name)?.toLowerCase() || p.name.toLowerCase()
        map[key] = {
          id: p.id,
          name: p.name,
          changeToday: Number(p.change_today || 0),
          usdToKwd: Number(p.usd_to_kwd || 0.307),
          holdings: [],
        }
        // Use the first platform's usd_to_kwd for the input
        if (key === "binance") setRateInput(String(p.usd_to_kwd || 0.307))
      }

      for (const h of holdRows) {
        for (const key of Object.keys(map)) {
          if (map[key].id === h.platform_id) {
            map[key].holdings.push({
              id: h.id,
              platformId: h.platform_id,
              asset: h.asset,
              quantity: Number(h.quantity),
              buyPrice: Number(h.buy_price),
              currentPrice: Number(h.current_price),
            })
          }
        }
      }

      setPlatforms(map)
      setLoaded(true)
    })
  }, [])

  function getRate(): number {
    // Use the primary rate from binance
    return platforms.binance?.usdToKwd || 0.307
  }

  function updateRate() {
    const v = parseFloat(rateInput)
    if (v <= 0) return
    const rate = v
    // Update all platforms
    for (const key of Object.keys(platforms)) {
      const plat = platforms[key]
      supabase.from("portfolio_platforms").update({ usd_to_kwd: rate }).eq("id", plat.id)
    }
    setPlatforms((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key], usdToKwd: rate }
      }
      return next
    })
  }

  function toggleCollapse(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updateChange(key: string, val: number) {
    const plat = platforms[key]
    if (!plat) return
    supabase.from("portfolio_platforms").update({ change_today: val }).eq("id", plat.id)
    setPlatforms((prev) => ({
      ...prev,
      [key]: { ...prev[key], changeToday: val },
    }))
  }

  async function addHolding(key: string) {
    const qty = parseFloat(addQty)
    const buy = parseFloat(addBuy)
    const cur = parseFloat(addCur)
    if (!addAsset.trim() || isNaN(qty) || isNaN(buy) || isNaN(cur)) return

    const plat = platforms[key]
    if (!plat) return

    const { data, error } = await supabase
      .from("portfolio_holdings")
      .insert({
        platform_id: plat.id,
        asset: addAsset.trim().toUpperCase(),
        quantity: qty,
        buy_price: buy,
        current_price: cur,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("Failed to add holding:", error)
      return
    }

    const newHolding: Holding = {
      id: data.id,
      platformId: data.platform_id,
      asset: data.asset,
      quantity: Number(data.quantity),
      buyPrice: Number(data.buy_price),
      currentPrice: Number(data.current_price),
    }

    setPlatforms((prev) => ({
      ...prev,
      [key]: { ...prev[key], holdings: [...prev[key].holdings, newHolding] },
    }))
    setAddingPlatform(null)
    setAddAsset("")
    setAddQty("")
    setAddBuy("")
    setAddCur("")
  }

  async function removeHolding(platformKey: string, holdingId: string) {
    const { error } = await supabase.from("portfolio_holdings").delete().eq("id", holdingId)
    if (error) {
      console.error("Failed to remove holding:", error)
      return
    }
    setPlatforms((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        holdings: prev[platformKey].holdings.filter((h) => h.id !== holdingId),
      },
    }))
  }

  function platformValue(key: string): number {
    return (platforms[key]?.holdings || []).reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)
  }

  function platformPnl(key: string): number {
    return (platforms[key]?.holdings || []).reduce((sum, h) => sum + (h.currentPrice - h.buyPrice) * h.quantity, 0)
  }

  const rate = getRate()

  const binanceVal = platformValue("binance")
  const boursaVal = platformValue("kuwaitBoursa")
  const etoroVal = platformValue("eToro")

  const binancePnl = platformPnl("binance")
  const boursaPnl = platformPnl("kuwaitBoursa")
  const etoroPnl = platformPnl("eToro")

  const totalKwd = binanceVal * rate + boursaVal + etoroVal * rate
  const totalPnl = binancePnl * rate + boursaPnl + etoroPnl * rate
  const pnlPercent = totalKwd > 0 ? (totalPnl / (totalKwd - totalPnl)) * 100 : 0

  const platformKeys = ["binance", "kuwaitBoursa", "eToro"] as const

  const CURRENCY_MAP: Record<string, "USD" | "KWD"> = {
    binance: "USD",
    kuwaitBoursa: "KWD",
    eToro: "USD",
  }

  if (!loaded) {
    return (
      <div className="glass-card-static p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Portfolio Tracker</h2>
        <div className="h-40 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 glass-card-static p-5 transition-all duration-300">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Portfolio Tracker</h2>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">Total Portfolio</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {fmt(totalKwd, "KWD")} KWD
          </p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">Total P&amp;L</p>
          <p className={`mt-1 text-2xl font-semibold ${totalPnl >= 0 ? "text-accent" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl, "KWD")} KWD
          </p>
        </div>
        <div className="rounded-lg bg-bg-card-hover p-3">
          <p className="text-xs font-medium tracking-wider uppercase text-text-muted">P&amp;L %</p>
          <p className={`mt-1 text-2xl font-semibold ${pnlPercent >= 0 ? "text-accent" : "text-red-400"}`}>
            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 border-t border-border pt-3">
        <label className="text-xs font-medium tracking-wider uppercase text-text-muted">1 USD =</label>
        <input
          type="number"
          step="0.001"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onBlur={updateRate}
          onKeyDown={(e) => e.key === "Enter" && updateRate()}
          className="w-20 rounded-lg border border-border bg-bg-card-hover px-2 py-1 text-sm text-text-primary outline-none"
        />
        <span className="text-xs font-medium tracking-wider uppercase text-text-muted">KWD</span>
      </div>

      <div className="space-y-3">
        {platformKeys.map((key) => {
          const platform = platforms[key]
          if (!platform) return null
          const val = platformValue(key)
          const pnl = platformPnl(key)
          const currency = CURRENCY_MAP[key]
          const isCollapsed = collapsed[key]

          return (
            <div key={key} className="rounded-lg border border-border bg-bg-card-hover">
              <button
                onClick={() => toggleCollapse(key)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
                <span className="flex-1 text-sm font-medium text-text-primary">
                  {PLATFORM_LABELS[key] || platform.name}
                </span>
                <span className="text-xs text-text-secondary">{currency}</span>
                <span className="text-sm font-semibold text-text-primary">
                  {fmt(val, currency)} {currency === "KWD" ? "KWD" : ""}
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-border px-4 pb-3 pt-3">
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-xs text-text-secondary">Change today:</label>
                    <input
                      type="number"
                      value={platform.changeToday || ""}
                      onChange={(e) => updateChange(key, parseFloat(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-border bg-bg-card px-2 py-1 text-sm text-text-primary outline-none"
                    />
                    {platform.changeToday !== 0 && (
                      <span className={`text-xs font-medium ${platform.changeToday > 0 ? "text-accent" : "text-red-400"}`}>
                        {platform.changeToday > 0 ? "+" : ""}{platform.changeToday} {currency}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-2 px-2 py-1 text-[10px] text-text-secondary">
                      <span className="col-span-1">Asset</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Buy</span>
                      <span className="text-right">Now</span>
                      <span className="text-right">P&L</span>
                    </div>
                    {platform.holdings.map((h) => {
                      const hPnl = (h.currentPrice - h.buyPrice) * h.quantity
                      return (
                        <div
                          key={h.id}
                          className="group grid grid-cols-5 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-card"
                        >
                          <span className="text-sm font-medium text-text-primary">{h.asset}</span>
                          <span className="text-right text-sm text-text-secondary">{fmt(h.quantity, currency)}</span>
                          <span className="text-right text-sm text-text-secondary">{fmt(h.buyPrice, currency)}</span>
                          <span className="text-right text-sm text-text-secondary">{fmt(h.currentPrice, currency)}</span>
                          <div className="flex items-center justify-end gap-1">
                            <span className={`text-sm font-medium ${hPnl >= 0 ? "text-accent" : "text-red-400"}`}>
                              {hPnl >= 0 ? "+" : ""}{fmt(hPnl, currency)}
                            </span>
                            <button
                              onClick={() => removeHolding(key, h.id)}
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {platform.holdings.length === 0 && (
                    <p className="py-2 text-center text-xs text-text-secondary">No holdings yet</p>
                  )}

                  {addingPlatform === key ? (
                    <div className="mt-3 grid grid-cols-5 gap-2 rounded-lg bg-bg-card p-2">
                      <input
                        type="text"
                        placeholder="Asset"
                        value={addAsset}
                        onChange={(e) => setAddAsset(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="col-span-1 rounded border border-border bg-bg-card-hover px-2 py-1 text-sm text-text-primary placeholder-text-secondary outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-border bg-bg-card-hover px-2 py-1 text-sm text-text-primary placeholder-text-secondary outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Buy"
                        value={addBuy}
                        onChange={(e) => setAddBuy(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-border bg-bg-card-hover px-2 py-1 text-sm text-text-primary placeholder-text-secondary outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Now"
                        value={addCur}
                        onChange={(e) => setAddCur(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-border bg-bg-card-hover px-2 py-1 text-sm text-text-primary placeholder-text-secondary outline-none"
                      />
                      <button
                        onClick={() => addHolding(key)}
                        className="rounded bg-accent/20 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingPlatform(key)
                        setAddAsset("")
                        setAddQty("")
                        setAddBuy("")
                        setAddCur("")
                      }}
                      className="mt-2 flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent"
                    >
                      <Plus className="h-3 w-3" /> Add Holding
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
