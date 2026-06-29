"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard, BarChart3, Factory, ShieldCheck,
  ChevronRight, Sparkles, ArrowRight, Check,
} from "lucide-react"

const ONBOARDING_KEY = "lcc-onboarded"

type Step = {
  icon: typeof LayoutDashboard
  emoji: string
  title: string
  subtitle: string
  desc: string
  features: string[]
}

const steps: Step[] = [
  {
    icon: LayoutDashboard,
    emoji: "📅",
    title: "Overview",
    subtitle: "لمحة شاملة عن يومك",
    desc: "كل شي في مكان واحد — المهام، العادات، الفواتير القادمة، حالة المحفظة، والمشاريع النشطة. بطاقات مختصرة تقدر تفتحها للحصول على التفاصيل.",
    features: [
      "بطاقات summary للمهام والعادات",
      "صافي المحفظة والأصول",
      "الفواتير القادمة والقضايا",
      "المشاريع النشطة",
    ],
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Financial",
    subtitle: "أموالك واستثماراتك",
    desc: "تتبع محفظتك الاستثمارية، شوف الأسهم المقومة بأقل من قيمتها، احسب الـ Cash Runway، وسجل صفقاتك. كل التحليل المالي في مكان واحد.",
    features: [
      "Portfolio tracker مع أسعار حية",
      "Value Watch — أسهم مقومة بأقل من قيمتها",
      "Cash Runway — كم شهر صامد",
      "Trading Journal + Osoul Analysis",
    ],
  },
  {
    icon: Factory,
    emoji: "🏭",
    title: "Operating",
    subtitle: "عملياتك اليومية",
    desc: "إدارة المناوبات، المهام اليومية، العادات، وتتبع المشاريع. الـ heartbeat اليومي لعملياتك.",
    features: [
      "جدول المناوبات (Shift tracker)",
      "قائمة المهام (To-Do list)",
      "Habit tracker — 10 عادات يومية",
      "Project milestones",
    ],
  },
  {
    icon: ShieldCheck,
    emoji: "🛡️",
    title: "The Vault",
    subtitle: "القبو — ملفاتك الحساسة",
    desc: "القضايا القانونية، الفواتير الشهرية، الميزانية، وضمانات المشتريات. كل شي مهم ومصيري في مكان آمن.",
    features: [
      "قضايا قانونية مع تواريخ وأطراف",
      "فاتورة الشهر الحالي",
      "ميزانية شهرية مع progress bar",
      "متابعة ضمانات المشتريات",
    ],
  },
]

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
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
                {current.title}
              </h2>
              <p className="text-sm text-accent font-medium mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {current.desc}
          </p>

          {/* Features */}
          <ul className="space-y-2.5">
            {current.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-text-primary"
              >
                <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
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
            className="btn-ghost text-sm text-text-muted hover:text-text-primary"
          >
            تخطي ✕
          </button>

          <button
            onClick={handleNext}
            className="btn-primary group"
          >
            {isLast ? (
              <>
                <Sparkles className="h-4 w-4" />
                ابدأ
              </>
            ) : (
              <>
                التالي
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
