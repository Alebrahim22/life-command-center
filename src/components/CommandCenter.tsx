"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Sparkles, ShieldCheck, BarChart3,
  LayoutDashboard, Shield, Printer, Command,
  RotateCcw, RefreshCw,
} from "lucide-react"
import QuickActionFab from "@/components/QuickActionFab"
import CommandPalette from "@/components/CommandPalette"
import { supabase } from "@/lib/supabase"
import { DeskId } from "@/lib/utils"
import NotificationBell from "@/components/NotificationBell"
import ThemeToggle from "@/components/ThemeToggle"
import LangToggle from "@/components/LangToggle"
import { useLocale } from "@/lib/i18n"
import OverviewDesk from "@/components/desks/OverviewDesk"
import FinancialDesk from "@/components/desks/FinancialDesk"
import OperatingDesk from "@/components/desks/OperatingDesk"
import VaultDesk from "@/components/desks/VaultDesk"

// ─── Desk data constructors ──────────────────────────────────

interface DeskItem {
  id: DeskId
  label: string
  icon: React.ElementType
  desc: string
}

interface MobileDeskItem {
  key: DeskId
  tLabel: string
  icon: React.ElementType
}

function makeDesks(t: (p: string) => string): DeskItem[] {
  return [
    { id: "overview", label: t("commandCenter.desks.overview"), icon: Sparkles, desc: t("commandCenter.desks.overviewDesc") },
    { id: "financial", label: t("commandCenter.desks.financial"), icon: BarChart3, desc: t("commandCenter.desks.financialDesc") },
    { id: "operating", label: t("commandCenter.desks.operating"), icon: LayoutDashboard, desc: t("commandCenter.desks.operatingDesc") },
    { id: "vault", label: t("commandCenter.desks.vault"), icon: Shield, desc: t("commandCenter.desks.vaultDesc") },
  ]
}

const MOBILE_DESKS: MobileDeskItem[] = [
  { key: "overview", tLabel: "commandCenter.desks.overview", icon: Sparkles },
  { key: "financial", tLabel: "commandCenter.desks.financial", icon: BarChart3 },
  { key: "operating", tLabel: "commandCenter.desks.operating", icon: LayoutDashboard },
  { key: "vault", tLabel: "commandCenter.desks.vaultMobile", icon: Shield },
]

// ================================================================
// 💻 Desktop Layout — Tabbed Desk Bar
// ================================================================
function DesktopLayout({ activeDesk, setActiveDesk }: { activeDesk: DeskId; setActiveDesk: (d: DeskId) => void }) {
  const { t } = useLocale()
  const DESKS = useMemo(() => makeDesks(t), [t])

  const handleRegisterDevice = async () => {
    try {
      const { data, error } = await supabase.auth.registerPasskey()
      if (error) {
        alert(`Registration Sync Error: ${error.message}`)
      } else {
        alert("Success! This device's biometric signature is securely paired to your vault.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
      {/* Mohammed's Premium Header */}
      <div className="mb-5 flex items-center justify-between animate-fade-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-emerald-500 to-accent/80 shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-border-active/50">
              <span className="text-sm font-bold text-white">م</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-text-primary">
                <span className="text-text-muted/50 font-normal">{t("commandCenter.header.command")}</span> {t("commandCenter.header.center")}
              </h1>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent/60" />
                {DESKS.find((d) => d.id === activeDesk)?.desc ?? t("commandCenter.desks.overviewDesc")}
                <span className="text-text-muted/30 mx-0.5">•</span>
                <span className="text-text-muted/40 font-mono tabular-nums text-[10px]">
                  {DESKS.findIndex((d) => d.id === activeDesk) + 1}/4
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => window.print()}
            className="btn-ghost text-xs active:scale-95 touch-action-manipulation"
            title={t("commandCenter.printTooltip")}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("commandCenter.print")}</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-ghost text-xs active:scale-95 touch-action-manipulation"
            title={t("commandCenter.refreshTooltip")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("commandCenter.refresh")}</span>
          </button>
          <ThemeToggle />
          <LangToggle />
          <kbd className="hidden rounded-md border border-border bg-bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted/60 sm:inline-flex items-center gap-0.5">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
          <button
            onClick={handleRegisterDevice}
            className="btn-ghost text-xs active:scale-95 touch-action-manipulation"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("commandCenter.pairDevice")}
          </button>
        </div>
      </div>

      {/* ─────────────── Desk Bar ─────────────── */}
      <div className="mb-5 animate-fade-slide-up">
        <div className="glass-card-static flex items-center gap-1 px-1.5 py-1.5 rounded-xl border-border bg-bg-glass-strong backdrop-blur-sm">
          {DESKS.map((desk, idx) => {
            const active = activeDesk === desk.id
            const Icon = desk.icon
            return (
              <button
                key={desk.id}
                onClick={() => setActiveDesk(desk.id)}
                className={`relative flex flex-1 items-center justify-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 min-h-[44px] touch-action-manipulation active:scale-[0.97] ${
                  active
                    ? "text-text-primary bg-accent/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-card"
                }`}
              >
                <Icon className={`h-4 w-4 transition-all duration-300 ${
                  active ? "text-accent drop-shadow-[0_0_6px_rgba(34,197,94,0.3)]" : ""
                }`} />
                <span className="hidden sm:inline">{desk.label}</span>
                <span className="text-[10px] font-mono tabular-nums text-text-muted/40 hidden sm:inline">[{idx + 1}]</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-accent/60 via-accent to-accent/60 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─────────────── Desk Content ─────────────── */}
      <div className="animate-widget-enter" key={activeDesk}>
        {activeDesk === "overview" && <OverviewDesk />}
        {activeDesk === "financial" && <FinancialDesk />}
        {activeDesk === "operating" && <OperatingDesk />}
        {activeDesk === "vault" && <VaultDesk />}
      </div>

      {/* ─────────────── Footer ─────────────── */}
      <div className="mt-8 flex items-center justify-center gap-4 border-t border-border pt-4">
        <button
          onClick={() => { localStorage.removeItem("lcc-onboarded"); window.location.reload() }}
          className="text-[10px] text-text-muted/40 hover:text-text-muted transition-colors touch-action-manipulation active:scale-95"
          title={t("commandCenter.footer.replayTourTooltip")}
        >
          <RotateCcw className="h-3 w-3 inline mr-1" />
          {t("commandCenter.footer.replayTour")}
        </button>
        <span className="text-[9px] text-text-muted/20">{t("commandCenter.footer.searchHint")}</span>
      </div>
    </div>
  )
}

// ================================================================
// 📱 Mobile Layout — zero-scroll, sub-tabbed
// ================================================================
function MobileLayout({ activeDesk, setActiveDesk }: { activeDesk: DeskId; setActiveDesk: (d: DeskId) => void }) {
  const { t } = useLocale()
  const DESKS = useMemo(() => makeDesks(t), [t])

  return (
    <div className="h-screen overflow-hidden flex flex-col justify-between md:hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 overscroll-behavior-contain">
        {/* Mobile Header — single instance */}
        <div className="mb-4 flex items-center gap-3 animate-fade-slide-up">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-emerald-500 to-accent/80 shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-border-active/50">
            <span className="text-xs font-bold text-white">م</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text-primary">
              <span className="text-text-muted/50 font-normal">{t("commandCenter.header.command")}</span> {t("commandCenter.header.center")}
            </h1>
            <p className="text-[10px] text-text-muted flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-accent/60" />
              {DESKS.find((d) => d.id === activeDesk)?.desc ?? t("commandCenter.desks.overviewDesc")}
            </p>
          </div>
        </div>

        <div className="animate-fade-slide-up flex flex-col gap-2">
          {activeDesk === "overview" && <OverviewDesk />}
          {activeDesk === "financial" && <FinancialDesk />}
          {activeDesk === "operating" && <OperatingDesk />}
          {activeDesk === "vault" && <VaultDesk />}
        </div>
      </div>

      {/* Mobile Desk Bar */}
      <div className="flex items-center justify-evenly border-t border-border bg-bg-glass-strong backdrop-blur-xl supports-[backdrop-filter]:bg-bg-glass-strong pb-safe min-h-[56px]">
        {MOBILE_DESKS.map((d) => {
          const active = activeDesk === d.key
          const Icon = d.icon
          return (
            <button
              key={d.key}
              onClick={() => setActiveDesk(d.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium tracking-wide transition-all duration-200 min-h-[44px] touch-action-manipulation active:scale-90 ${
                active ? "text-accent" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "drop-shadow-[0_0_4px_rgba(34,197,94,0.3)]" : ""}`} />
              {t(d.tLabel)}
              {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full shadow-[0_0_6px_rgba(34,197,94,0.3)]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
// 🚀 CommandCenter — Entry point
// ================================================================
export default function CommandCenter() {
  const [activeDesk, setActiveDesk] = useState<DeskId>("overview")
  const [paletteOpen, setPaletteOpen] = useState(false)

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      // Ctrl/Cmd+K → toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }

      // ? → open palette
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }

      // Escape → close palette
      if (e.key === "Escape") {
        setPaletteOpen(false)
        return
      }

      // 1-4 → navigate desks
      const deskMap: Record<string, DeskId> = {
        "1": "overview",
        "2": "financial",
        "3": "operating",
        "4": "vault",
      }
      if (e.key in deskMap) {
        setActiveDesk(deskMap[e.key])
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(desk) => setActiveDesk(desk)}
      />
      <div className="hidden md:block">
        <DesktopLayout activeDesk={activeDesk} setActiveDesk={setActiveDesk} />
      </div>
      <MobileLayout activeDesk={activeDesk} setActiveDesk={setActiveDesk} />
      <QuickActionFab />
    </>
  )
}
