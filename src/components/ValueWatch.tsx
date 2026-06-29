"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ArrowUpRight } from "lucide-react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { MarketRadar, formatCurrency } from "@/lib/utils"

// ================================================================
// 📈 High-Conviction Stocks (Value Watch)
// ================================================================

export default function ValueWatch() {
  const [stocks, setStocks] = useState<MarketRadar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("market_radar").select("ticker, name, price, fv").then(({ data }) => {
      if (data) {
        const withMargin = data
          .filter((r) => r.fv && Number(r.fv) > Number(r.price))
          .map((r) => ({
            ticker: r.ticker,
            name: r.name,
            price: Number(r.price),
            fv: Number(r.fv),
            margin: (Number(r.fv) - Number(r.price)) / Number(r.price),
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 3)
        setStocks(withMargin)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-32" />

  return (
    <MiniCard title="Value Watch" accent="green">
      {stocks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <TrendingUp className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No undervalued picks today</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {stocks.map((s) => (
            <div key={s.ticker} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-bg-card">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="text-sm font-semibold font-mono text-text-primary">{s.ticker}</span>
              <span className="flex-1 truncate text-sm text-text-secondary">{s.name}</span>
              <span className="text-sm font-mono text-text-secondary">{formatCurrency(s.price)}</span>
              <span className="flex items-center gap-0.5 text-[12px] font-semibold font-mono text-accent">
                {(s.margin * 100).toFixed(0)}% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}
