"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard, BarChart3, Factory, ShieldCheck,
  ChevronRight, Sparkles, ArrowRight, Check,
} from "lucide-react"
import { useLocale } from "@/lib/i18n"

const ONBOARDING_KEY = "lcc-onboarded"

type Step = {
  icon: typeof LayoutDashboard
  emoji: string
  tTitle: string
  tSubtitle: string
  tDesc: string
  tFeatures: string[]
}

const steps: Step[] = [
  {
    icon: LayoutDashboard,
    emoji: "📅",
    tTitle: "onboarding.step1.title",
    tSubtitle: "onboarding.step1.subtitle",
    tDesc: "onboarding.step1.desc",
    tFeatures: [
      "onboarding.step1.features.0",
      "onboarding.step1.features.1",
      "onboarding.step1.features.2",
      "onboarding.step1.features.3",
    ],
  },
  {
    icon: BarChart3,
    emoji: "📊",
    tTitle: "onboarding.step2.title",
    tSubtitle: "onboarding.step2.subtitle",
    tDesc: "onboarding.step2.desc",
    tFeatures: [
      "onboarding.step2.features.0",
      "onboarding.step2.features.1",
      "onboarding.step2.features.2",
      "onboarding.step2.features.3",
    ],
  },
  {
    icon: Factory,
    emoji: "🏭",
    tTitle: "onboarding.step3.title",
    tSubtitle: "onboarding.step3.subtitle",
    tDesc: "onboarding.step3.desc",
    tFeatures: [
      "onboarding.step3.features.0",
      "onboarding.step3.features.1",
      "onboarding.step3.features.2",
      "onboarding.step3.features.3",
    ],
  },
  {
    icon: ShieldCheck,
    emoji: "🛡️",
    tTitle: "onboarding.step4.title",
    tSubtitle: "onboarding.step4.subtitle",
    tDesc: "onboarding.step4.desc",
    tFeatures: [
      "onboarding.step4.features.0",
      "onboarding.step4.features.1",
      "onboarding.step4.features.2",
      "onboarding.step4.features.3",
    ],
  },
]

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const { t } = useLocale()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const current = steps[step]
  const isLast = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  const handleNext = () => {
    if (isLast) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }

  const finish = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      localStorage.setItem(ONBOARDING_KEY, "true")
      onFinish()
    }, 400)
  }

  const skip = () => {
    finish()
  }

  if (!visible) return null

  const IconComponent = current.icon

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg-primary transition-all duration-500 ${
        exiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent-gold/3 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg mx-auto px-6">
        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex-1 h-1 bg-bg-glass rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-text-muted font-medium tabular-nums">
            {step + 1}/{steps.length}
          </span>
        </div>

        {/* Card */}
        <div
          key={step}
          className="animate-stagger glass-card-static p-8 space-y-6"
          style={{ "--stagger-delay": "40ms" } as React.CSSProperties}
        >
          {/* Icon */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 shadow-lg shadow-accent/5">
              <span className="text-2xl">{current.emoji}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                {t(current.tTitle)}
              </h2>
              <p className="text-sm text-accent font-medium mt-0.5">
                {t(current.tSubtitle)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {t(current.tDesc)}
          </p>

          {/* Features */}
          <ul className="space-y-2.5">
            {current.tFeatures.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-text-primary"
              >
                <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{t(f)}</span>
              </li>
            ))}
          </ul>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 touch-action-manipulation active:scale-90 ${
                  i === step
                    ? "w-8 bg-accent"
                    : i < step
                    ? "w-2 bg-accent/40"
                    : "w-2 bg-bg-glass-strong"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={skip}
            className="btn-ghost text-sm text-text-muted hover:text-text-primary active:scale-95 touch-action-manipulation"
          >
            {t("onboarding.skip")}
          </button>

          <button
            onClick={handleNext}
            className="btn-primary group active:scale-[0.97] touch-action-manipulation"
          >
            {isLast ? (
              <>
                <Sparkles className="h-4 w-4" />
                {t("onboarding.start")}
              </>
            ) : (
              <>
                {t("onboarding.next")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * useOnboarding — Returns true if onboarding is still needed, false if already done.
 */
export function useOnboarding() {
  const [needed, setNeeded] = useState(true)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    setNeeded(done !== "true")
  }, [])

  return needed
}
