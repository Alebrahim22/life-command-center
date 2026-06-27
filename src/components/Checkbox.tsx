interface Props {
  checked: boolean
  onChange: () => void
  className?: string
}

export default function Checkbox({ checked, onChange, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-transparent text-transparent hover:border-text-secondary"
      } ${className}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
          <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
