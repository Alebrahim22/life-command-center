"use client"

/* ─── Types ─────────────────────────────────────────────────── */

export type Locale = "ar" | "en"

type NestedDict = { [key: string]: string | NestedDict }

/* ─── Dictionaries ──────────────────────────────────────────── */

const ar: NestedDict = {
  commandCenter: {
    header: {
      command: "Command",
      center: "Center",
    },
    print: "طباعة",
    printTooltip: "طباعة / تصدير PDF",
    refresh: "تحديث",
    refreshTooltip: "تحديث جميع البيانات",
    pairDevice: "ربط الجهاز",
    desks: {
      overview: "الرئيسية",
      overviewDesc: "نظرة سريعة على الحياة",
      financial: "المالية",
      financialDesc: "المحفظة، أصول وتحليل",
      operating: "التشغيلية",
      operatingDesc: "المناوبات، المهام والمشاريع",
      vault: "الخزنة",
      vaultDesc: "القضايا، الفواتير والميزانية",
      vaultMobile: "الخزنة",
    },
    footer: {
      replayTour: "إعادة الجولة التعريفية",
      replayTourTooltip: "إعادة الجولة التعريفية",
      searchHint: "⌘K أو ? للبحث",
    },
  },
  theme: {
    dark: "الوضع الداكن",
    light: "الوضع النهاري",
    toggleBtn: {
      dark: "الوضع الداكن",
      light: "الوضع النهاري",
    },
  },
  themeToggle: {
    darkTooltip: "الوضع الداكن",
    lightTooltip: "الوضع النهاري",
    darkLabel: "داكن",
    lightLabel: "نهاري",
  },
  onboarding: {
    skip: "تخطي",
    next: "التالي",
    start: "انطلق 🚀",
    step1: {
      title: "مرحباً بك في Command Center",
      subtitle: "مركز التحكم الشخصي",
      desc: "هذا هو مركز التحكم الشخصي لحياتك اليومية. كل شيء في مكان واحد.",
      features: {
        "0": "لمحة سريعة عن يومك",
        "1": "المناوبات والمهام والعادات",
        "2": "المحفظة والتحليل المالي",
        "3": "القضايا والفواتير والميزانية",
      },
    },
    step2: {
      title: "المكاتب الأربعة",
      subtitle: "نظّم عالمك",
      desc: "كل مكتب صُمّم لغرض معين. انتقل بينهم بسلاسة.",
      features: {
        "0": "الرئيسية: لمحة سريعة عن اليوم",
        "1": "المالية: المحفظة وأصول",
        "2": "التشغيلية: المناوبات والمشاريع",
        "3": "الخزنة: القضايا والفواتير",
      },
    },
    step3: {
      title: "الاختصارات الذكية",
      subtitle: "حكّم بدون ماوس",
      desc: "اختصارات لوحة المفاتيح تخلّصك من النقر المتكرر.",
      features: {
        "0": "1-4: التنقل بين المكاتب",
        "1": "⌘K: فتح نافذة البحث",
        "2": "?: المساعدة والاختصارات",
        "3": "Escape: إغلاق النوافذ",
      },
    },
    step4: {
      title: "جاهز للانطلاق",
      subtitle: "كل شيء تحت السيطرة",
      desc: "أنت الآن جاهز. استكشف المكاتب وابدأ بتنظيم حياتك.",
      features: {
        "0": "البيانات آمنة ومشفرة",
        "1": "يعمل بدون إنترنت بعد التحميل",
        "2": "يدعم Arabic و English",
        "3": "مصمم للجوال والديسكتوب",
      },
    },
  },
  lang: {
    switchToEn: "English",
    switchToAr: "العربية",
    toggleBtn: "التبديل للعربية",
    toggleBtnEn: "Switch to English",
  },
}

const en: NestedDict = {
  commandCenter: {
    header: {
      command: "Command",
      center: "Center",
    },
    print: "Print",
    printTooltip: "Print / Export PDF",
    refresh: "Refresh",
    refreshTooltip: "Refresh all data",
    pairDevice: "Pair Device Passkey",
    desks: {
      overview: "Overview",
      overviewDesc: "Life at a glance",
      financial: "Financial",
      financialDesc: "Portfolio, Osoul & Trades",
      operating: "Operating",
      operatingDesc: "Shifts, Tasks & Projects",
      vault: "The Vault",
      vaultDesc: "Legal, Bills & Budget",
      vaultMobile: "Vault",
    },
    footer: {
      replayTour: "Replay tour",
      replayTourTooltip: "Replay onboarding tour",
      searchHint: "⌘K or ? to search",
    },
  },
  theme: {
    dark: "Dark mode",
    light: "Light mode",
    toggleBtn: {
      dark: "Dark mode",
      light: "Light mode",
    },
  },
  themeToggle: {
    darkTooltip: "Dark mode",
    lightTooltip: "Light mode",
    darkLabel: "Dark",
    lightLabel: "Light",
  },
  onboarding: {
    skip: "Skip",
    next: "Next",
    start: "Get Started 🚀",
    step1: {
      title: "Welcome to Command Center",
      subtitle: "Your Personal Hub",
      desc: "Your personal control hub for daily life. Everything in one place.",
      features: {
        "0": "Quick glance at your day",
        "1": "Shifts, tasks & habits",
        "2": "Portfolio & financial analysis",
        "3": "Legal cases, bills & budget",
      },
    },
    step2: {
      title: "The Four Desks",
      subtitle: "Organize Your World",
      desc: "Each desk serves a specific purpose. Navigate seamlessly.",
      features: {
        "0": "Overview: Life at a glance",
        "1": "Financial: Portfolio & Osoul",
        "2": "Operating: Shifts & projects",
        "3": "Vault: Legal & bills",
      },
    },
    step3: {
      title: "Smart Shortcuts",
      subtitle: "Control Without a Mouse",
      desc: "Keyboard shortcuts eliminate repetitive clicking.",
      features: {
        "0": "1-4: Navigate between desks",
        "1": "⌘K: Open command palette",
        "2": "?: Help & shortcuts",
        "3": "Escape: Close windows",
      },
    },
    step4: {
      title: "Ready to Go",
      subtitle: "Everything Under Control",
      desc: "You're all set. Explore the desks and start organizing.",
      features: {
        "0": "Data is secure & encrypted",
        "1": "Works offline once loaded",
        "2": "Supports Arabic & English",
        "3": "Designed for mobile & desktop",
      },
    },
  },
  lang: {
    switchToEn: "English",
    switchToAr: "العربية",
    toggleBtn: "العربية",
    toggleBtnEn: "Switch to English",
  },
}

/* ─── Helpers ────────────────────────────────────────────────── */

function get(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (typeof current !== "object" || current === null) return path
    const next = (current as Record<string, unknown>)[key]
    if (next === undefined) return path
    if (typeof next === "string") return next
    current = next
  }
  return typeof current === "string" ? current : path
}

/* ─── Locale Storage ─────────────────────────────────────────── */

function loadLocale(): Locale {
  if (typeof window === "undefined") return "ar"
  try {
    const saved = localStorage.getItem("lcc-locale")
    if (saved === "en" || saved === "ar") return saved
  } catch {}
  return "ar"
}

function saveLocale(locale: Locale) {
  try {
    localStorage.setItem("lcc-locale", locale)
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  } catch {}
}

/* ─── React Context ──────────────────────────────────────────── */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface I18nCtx {
  t: (path: string) => string
  locale: Locale
  setLocale: (l: Locale) => void
  dir: "rtl" | "ltr"
}

const I18nContext = createContext<I18nCtx>({
  t: (p) => p,
  locale: "ar",
  setLocale: () => {},
  dir: "rtl",
})

const DICT: Record<Locale, NestedDict> = { ar, en }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    saveLocale(l)
  }, [])

  const t = useCallback((path: string): string => get(DICT[locale], path), [locale])

  return (
    <I18nContext.Provider value={{ t, locale, setLocale, dir: locale === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLocale(): I18nCtx {
  return useContext(I18nContext)
}
