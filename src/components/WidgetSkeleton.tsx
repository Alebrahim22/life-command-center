"use client"

// ─── Suspense fallback for lazy widgets ──────────────────────────

export default function WidgetSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-white/[0.04] bg-bg-card p-5">
      <div className="skeleton-shimmer h-4 w-2/5" />
      <div className="skeleton-shimmer h-3 w-4/5" />
      <div className="skeleton-shimmer h-3 w-3/5" />
      <div className="skeleton-shimmer h-[1px] w-full" />
      <div className="skeleton-shimmer h-8 w-full" />
      <div className="skeleton-shimmer h-8 w-full" />
    </div>
  )
}
