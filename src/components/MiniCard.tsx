"use client"

// ================================================================
// 🃏 MiniCard — Glassmorphism
// ================================================================

export default function MiniCard({
  title,
  children,
  className = "",
  accent,
}: {
  title: string
  children: React.ReactNode
  className?: string
  accent?: "green" | "gold"
}) {
  return (
    <div
      className={`${
        accent === "gold" ? "glow-gold" : accent === "green" ? "glow-green" : ""
      } glass-card p-4 sm:p-5 ${className}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        <span className={`inline-block h-[3px] w-[3px] rounded-full ${
          accent === "gold" ? "bg-accent-gold" : "bg-accent"
        }`} />
        {title}
      </h3>
      {children}
    </div>
  )
}
