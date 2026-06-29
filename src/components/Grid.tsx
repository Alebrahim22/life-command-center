"use client"

// ================================================================
// 📐 Grid — 2-column responsive grid wrapper
// ================================================================

export default function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">{children}</div>
}
