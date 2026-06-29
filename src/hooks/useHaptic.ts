"use client"

/**
 * useHaptic — Mobile vibration feedback hook
 *
 * Patterns:
 *   haptic.light()   — tap feedback (5ms)
 *   haptic.medium()  — button press / toggle (10ms)
 *   haptic.heavy()   — destructive / significant action (20ms)
 *   haptic.click()   — light tap shorthand
 *
 * Falls back silently if navigator.vibrate is unavailable (desktop).
 */

type HapticStrength = "light" | "medium" | "heavy" | "click"

const DURATIONS: Record<HapticStrength, number> = {
  light: 5,
  click: 5,
  medium: 10,
  heavy: 20,
}

export function useHaptic() {
  const vibrate = (ms: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms)
    }
  }

  return {
    light: () => vibrate(DURATIONS.light),
    medium: () => vibrate(DURATIONS.medium),
    heavy: () => vibrate(DURATIONS.heavy),
    click: () => vibrate(DURATIONS.click),
    custom: (ms: number) => vibrate(ms),
  }
}

/**
 * useHapticProps — Returns spreadable props for a clickable element
 * that provides haptic feedback on click.
 *
 * Usage:
 *   const hapticProps = useHapticProps("light")
 *   <button {...hapticProps}>Click me</button>
 */
export function useHapticProps(strength: HapticStrength = "click") {
  const haptic = useHaptic()
  const handler = haptic[strength]

  return {
    onClick: (e: React.MouseEvent) => {
      handler()
    },
    onTouchStart: () => {
      handler()
    },
  }
}
