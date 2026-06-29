"use client"

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

export default function EmptyState({
  icon = "📭",
  title = "Nothing here yet",
  description = "Add your first item to get started.",
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? "py-6" : "py-10"
      } px-4 text-center`}
    >
      <span className={`${compact ? "text-2xl" : "text-4xl"} mb-3`}>{icon}</span>
      <h4 className="text-sm font-medium text-text-primary">{title}</h4>
      <p className="mt-1 max-w-[220px] text-xs text-text-secondary leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg bg-accent/15 px-4 py-2 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent/25 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
