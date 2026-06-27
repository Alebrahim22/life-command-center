"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react"

interface Holding {
  id: string
  asset: string
  quantity: number
  buyPrice: number
  currentPrice: number
}

interface PlatformData {
  collapsed: boolean
  changeToday: number
  holdings: Holding[]
}

interface PortfolioData {
  usdToKwdRate: number
  binance: PlatformData
  kuwaitBoursa: PlatformData
  eToro: PlatformData
}

const STORAGE_KEY = "portfolio-data"

const PLATFORM_CURRENCIES: Record<string, "USD" | "KWD"> = {
  binance: "USD",
  kuwaitBoursa: "KWD",
  eToro: "USD",
}

const PLATFORM_LABELS: Record<string, string> = {
  binance: "Binance",
  kuwaitBoursa: "Kuwait Boursa",
  eToro: "eToro",
}

function emptyPlatform(): PlatformData {
  return { collapsed: false, changeToday: 0, holdings: [] }
}

function defaultData(): PortfolioData {
  return {
    usdToKwdRate: 0.307,
    binance: emptyPlatform(),
    kuwaitBoursa: emptyPlatform(),
    eToro: emptyPlatform(),
  }
}

function load(): PortfolioData {
  if (typeof window === "undefined") return defaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        usdToKwdRate: parsed.usdToKwdRate ?? 0.307,
        binance: { ...emptyPlatform(), ...parsed.binance },
        kuwaitBoursa: { ...emptyPlatform(), ...parsed.kuwaitBoursa },
        eToro: { ...emptyPlatform(), ...parsed.eToro },
      }
    }
  } catch {}
  return defaultData()
}

function fmt(n: number, currency: "USD" | "KWD"): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: currency === "KWD" ? 3 : 2,
    maximumFractionDigits: currency === "KWD" ? 3 : 2,
  })
}

export default function PortfolioTracker() {
  const [data, setData] = useState<PortfolioData>(defaultData())
  const [loaded, setLoaded] = useState(false)
  const [rateInput, setRateInput] = useState("0.307")

  const [addingPlatform, setAddingPlatform] = useState<string | null>(null)
  const [addAsset, setAddAsset] = useState("")
  const [addQty, setAddQty] = useState("")
  const [addBuy, setAddBuy] = useState("")
  const [addCur, setAddCur] = useState("")

  useEffect(() => {
    const d = load()
    setData(d)
    setRateInput(String(d.usdToKwdRate))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  function updateRate() {
    const v = parseFloat(rateInput)
    if (v > 0) setData((prev) => ({ ...prev, usdToKwdRate: v }))
  }

  function toggleCollapse(key: string) {
    setData((prev) => {
      const platform = { ...(prev[key as keyof PortfolioData] as unknown as PlatformData) }
      platform.collapsed = !platform.collapsed
      return { ...prev, [key]: platform }
    })
  }

  function updateChange(key: string, val: number) {
    setData((prev) => {
      const platform = { ...(prev[key as keyof PortfolioData] as unknown as PlatformData) }
      platform.changeToday = val
      return { ...prev, [key]: platform }
    })
  }

  function addHolding(key: string) {
    const qty = parseFloat(addQty)
    const buy = parseFloat(addBuy)
    const cur = parseFloat(addCur)
    if (!addAsset.trim() || isNaN(qty) || isNaN(buy) || isNaN(cur)) return
    const holding: Holding = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      asset: addAsset.trim().toUpperCase(),
      quantity: qty,
      buyPrice: buy,
      currentPrice: cur,
    }
    setData((prev) => {
      const platform = { ...(prev[key as keyof PortfolioData] as unknown as PlatformData) }
      platform.holdings = [...platform.holdings, holding]
      return { ...prev, [key]: platform }
    })
    setAddingPlatform(null)
    setAddAsset("")
    setAddQty("")
    setAddBuy("")
    setAddCur("")
  }

  function removeHolding(platformKey: string, holdingId: string) {
    setData((prev) => {
      const platform = { ...(prev[platformKey as keyof PortfolioData] as unknown as PlatformData) }
      platform.holdings = platform.holdings.filter((h) => h.id !== holdingId)
      return { ...prev, [platformKey]: platform }
    })
  }

  function platformValue(key: string): number {
    const p = data[key as keyof PortfolioData] as PlatformData
    return p.holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)
  }

  function platformPnl(key: string): number {
    const p = data[key as keyof PortfolioData] as PlatformData
    return p.holdings.reduce((sum, h) => sum + (h.currentPrice - h.buyPrice) * h.quantity, 0)
  }

  const rate = data.usdToKwdRate

  const binanceVal = platformValue("binance")
  const boursaVal = platformValue("kuwaitBoursa")
  const etoroVal = platformValue("eToro")

  const binancePnl = platformPnl("binance")
  const boursaPnl = platformPnl("kuwaitBoursa")
  const etoroPnl = platformPnl("eToro")

  const totalKwd = binanceVal * rate + boursaVal + etoroVal * rate
  const totalPnl = binancePnl * rate + boursaPnl + etoroPnl * rate
  const pnlPercent = totalKwd > 0 ? (totalPnl / (totalKwd - totalPnl)) * 100 : 0

  const platforms = ["binance", "kuwaitBoursa", "eToro"] as const

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Portfolio Tracker</h2>
        <div className="h-40 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#a0a0a0]">Portfolio Tracker</h2>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-xs text-[#a0a0a0]">Total Portfolio</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {fmt(totalKwd, "KWD")} KWD
          </p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-xs text-[#a0a0a0]">Total P&L</p>
          <p className={`mt-1 text-2xl font-semibold ${totalPnl >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl, "KWD")} KWD
          </p>
        </div>
        <div className="rounded-lg bg-[#222] p-3">
          <p className="text-xs text-[#a0a0a0]">P&L %</p>
          <p className={`mt-1 text-2xl font-semibold ${pnlPercent >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 border-t border-[#2a2a2a] pt-3">
        <label className="text-xs text-[#a0a0a0]">1 USD =</label>
        <input
          type="number"
          step="0.001"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onBlur={updateRate}
          onKeyDown={(e) => e.key === "Enter" && updateRate()}
          className="w-20 rounded-lg border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white outline-none"
        />
        <span className="text-xs text-[#a0a0a0]">KWD</span>
      </div>

      <div className="space-y-3">
        {platforms.map((key) => {
          const platform = data[key] as PlatformData
          const val = platformValue(key)
          const pnl = platformPnl(key)
          const currency = PLATFORM_CURRENCIES[key]
          const isCollapsed = platform.collapsed

          return (
            <div key={key} className="rounded-lg border border-[#2a2a2a] bg-[#222]">
              <button
                onClick={() => toggleCollapse(key)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-[#a0a0a0]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
                )}
                <span className="flex-1 text-sm font-medium text-white">
                  {PLATFORM_LABELS[key]}
                </span>
                <span className="text-xs text-[#a0a0a0]">{currency}</span>
                <span className="text-sm font-semibold text-white">
                  {fmt(val, currency)} {currency === "KWD" ? "KWD" : ""}
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-[#2a2a2a] px-4 pb-3 pt-3">
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-xs text-[#a0a0a0]">Change today:</label>
                    <input
                      type="number"
                      value={platform.changeToday || ""}
                      onChange={(e) => updateChange(key, parseFloat(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-sm text-white outline-none"
                    />
                    {platform.changeToday !== 0 && (
                      <span className={`text-xs font-medium ${platform.changeToday > 0 ? "text-[#22c55e]" : "text-red-400"}`}>
                        {platform.changeToday > 0 ? "+" : ""}{platform.changeToday} {currency}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-2 px-2 py-1 text-[10px] text-[#666]">
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
                          className="group grid grid-cols-5 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#1a1a1a]"
                        >
                          <span className="text-sm font-medium text-white">{h.asset}</span>
                          <span className="text-right text-sm text-[#c0c0c0]">{fmt(h.quantity, currency)}</span>
                          <span className="text-right text-sm text-[#a0a0a0]">{fmt(h.buyPrice, currency)}</span>
                          <span className="text-right text-sm text-[#a0a0a0]">{fmt(h.currentPrice, currency)}</span>
                          <div className="flex items-center justify-end gap-1">
                            <span className={`text-sm font-medium ${hPnl >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
                              {hPnl >= 0 ? "+" : ""}{fmt(hPnl, currency)} {currency === "KWD" ? "" : ""}
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
                    <p className="py-2 text-center text-xs text-[#666]">No holdings yet</p>
                  )}

                  {addingPlatform === key ? (
                    <div className="mt-3 grid grid-cols-5 gap-2 rounded-lg bg-[#1a1a1a] p-2">
                      <input
                        type="text"
                        placeholder="Asset"
                        value={addAsset}
                        onChange={(e) => setAddAsset(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="col-span-1 rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white placeholder-[#666] outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white placeholder-[#666] outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Buy"
                        value={addBuy}
                        onChange={(e) => setAddBuy(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white placeholder-[#666] outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Now"
                        value={addCur}
                        onChange={(e) => setAddCur(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHolding(key)}
                        className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-sm text-white placeholder-[#666] outline-none"
                      />
                      <button
                        onClick={() => addHolding(key)}
                        className="rounded bg-[#22c55e] bg-opacity-20 text-sm font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
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
                      className="mt-2 flex items-center gap-1 text-xs text-[#22c55e] transition-colors hover:text-[#22c55e]"
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
