"use client"

// ================================================================
// 📐 Section — animate-fade-slide-up wrapper
// ================================================================

export default function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`animate-fade-slide-up ${className}`}>{children}</div>
}
