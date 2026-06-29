"use client"

import { useLocale } from "@/lib/i18n"
import { Languages } from "lucide-react"

export default function LangToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="btn-ghost text-xs flex items-center gap-1.5 min-h-[44px]"
      title={locale === "ar" ? "Switch to English" : "التبديل للعربية"}
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="hidden sm:inline text-[10px] font-bold tracking-wider uppercase">
        {locale === "ar" ? "EN" : "AR"}
      </span>
    </button>
  )
}
