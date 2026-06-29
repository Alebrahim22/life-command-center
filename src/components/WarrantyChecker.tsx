"use client"

import { useState, useEffect } from "react"
import { ShieldCheck } from "lucide-react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { WarrantyItem, daysBetween } from "@/lib/utils"

// ================================================================
// 🛡️ Warranty Checker
// ================================================================

export default function WarrantyChecker() {
  const [items, setItems] = useState<WarrantyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("warranties").select("*").order("expiration_date", { ascending: true }).then(({ data }) => {
      if (data) {
        const now = new Date()
        const mapped = data.map((r: any) => {
          const exp = new Date(r.expiration_date + "T23:59:59")
          const pur = new Date(r.purchase_date + "T00:00:00")
          const daysRemaining = Math.max(0, daysBetween(now, exp))
          const totalDays = Math.max(1, daysBetween(pur, exp))
          return {
            id: r.id,
            itemName: r.item_name,
            provider: r.provider,
            purchaseDate: r.purchase_date,
            expirationDate: r.expiration_date,
            daysRemaining,
            totalDays,
          }
        })
        setItems(mapped)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-44" />

  return (
    <MiniCard title="Warranties & Service Agreements">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <ShieldCheck className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No warranties tracked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((w) => {
            const pct = w.totalDays > 0 ? ((w.totalDays - w.daysRemaining) / w.totalDays) * 100 : 0
            const critical = w.daysRemaining < 30
            const barColor = critical ? "bg-red-500" : w.daysRemaining < 90 ? "bg-amber-400" : "bg-accent"
            return (
              <div key={w.id} className="rounded-xl bg-white/[0.03] px-3.5 py-2.5 transition-all duration-200 hover:bg-white/[0.05]">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${critical ? "text-red-400" : "text-accent"}`} />
                    <span className="text-sm font-medium text-text-primary">{w.itemName}</span>
                  </div>
                  <span className={`text-xs font-mono font-medium ${critical ? "text-red-400" : "text-text-secondary"}`}>
                    {w.daysRemaining}d left
                  </span>
                </div>
                <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>{w.provider}</span>
                  <span>Expires {w.expirationDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MiniCard>
  )
}
