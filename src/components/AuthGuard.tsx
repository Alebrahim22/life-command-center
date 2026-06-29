"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Fingerprint, ChevronDown, ChevronUp, Eye, Lock, Mail, ShieldCheck } from "lucide-react"
import { useLocale } from "@/lib/i18n"

const GUEST_KEY = "lcc-guest-mode"
const AUTH_TIMEOUT = 5000 // 5s timeout → show auth screen with guest option

interface Props {
  children: React.ReactNode
}

export default function AuthGuard({ children }: Props) {
  const { t } = useLocale()
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [showBg, setShowBg] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true

    // 1) Guest session in localStorage → skip auth entirely
    const storedGuest = localStorage.getItem(GUEST_KEY)
    if (storedGuest === "true") {
      setGuestMode(true)
      setAuthed(true)
      setChecking(false)
      requestAnimationFrame(() => setShowBg(true))
      return
    }

    // 2) Timeout guard — if Supabase doesn't respond in 5s, show auth screen
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setAuthTimedOut(true)
        setChecking(false)
      }
    }, AUTH_TIMEOUT)

    // 3) Try Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setAuthed(!!session)
      setChecking(false)
      requestAnimationFrame(() => setShowBg(true))
    })

    // 4) Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return
      if (event === "SIGNED_IN") {
        setAuthed(true)
        setBusy(false)
        setPasswordBusy(false)
      }
      if (event === "SIGNED_OUT") {
        setAuthed(false)
        setGuestMode(false)
        localStorage.removeItem(GUEST_KEY)
      }
    })

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  const handleAuth = useCallback(async () => {
    setBusy(true)
    const { error } = await supabase.auth.signInWithPasskey()
    if (error) {
      setBusy(false)
    }
  }, [])

  const handlePasswordSignIn = useCallback(async () => {
    if (!email.trim() || !password.trim()) return
    setPasswordBusy(true)
    setPasswordError("")
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setPasswordError(error.message)
      setPasswordBusy(false)
    }
  }, [email, password])

  const handleGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "true")
    setGuestMode(true)
    setAuthed(true)
    setChecking(false)
  }, [])

  // ── Loading spinner (initial, before timeout) ──
  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-[2px] border-[rgba(34,197,94,0.15)] border-t-accent shadow-[0_0_20px_rgba(34,197,94,0.08)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-accent/60" />
          </div>
        </div>
      </div>
    )
  }

  // ── Auth screen ──
  if (!authed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg-primary">
        {/* Animated Background */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            showBg ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div
            className="absolute -start-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-[100px] animate-fade-in"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          />
          <div
            className="absolute -bottom-32 -end-32 h-80 w-80 rounded-full bg-accent-gold/5 blur-[120px] animate-fade-in"
            style={{ animationDelay: "600ms", animationFillMode: "both" }}
          />
        </div>

        {/* Auth Card */}
        <div
          className={`relative z-10 mx-4 w-full max-w-sm transition-all duration-700 ${
            showBg
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="glass-card-static p-8">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-[0_0_24px_rgba(34,197,94,0.15)]">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {t("auth.commandCenter")}
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                {authTimedOut
                  ? t("auth.serverUnreachable")
                  : t("auth.biometricRequired")
                }
              </p>
            </div>

            {/* Auth button — Passkey */}
            {!authTimedOut && (
              <>
                <button
                  onClick={handleAuth}
                  disabled={busy}
                  className="btn-primary w-full py-3 text-base active:scale-[0.98] touch-action-manipulation"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("auth.authenticating")}
                    </span>
                  ) : (
                    <>
                      <Fingerprint className="h-5 w-5" />
                      {t("auth.authenticate")}
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-widest text-text-muted">{t("auth.or")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {/* Show passkey timeout message */}
            {authTimedOut && (
              <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  {t("auth.timeoutMessage")}
                </p>
              </div>
            )}

            {/* Guest Mode Button */}
            <button
              onClick={handleGuestMode}
              className="btn-ghost w-full justify-center py-3 text-sm active:scale-95 touch-action-manipulation"
            >
              <Eye className="h-4 w-4" />
              {authTimedOut ? t("auth.continueAsGuest") : t("auth.continueAsGuestSkip")}
            </button>

            {/* Admin Override (only show when auth server is reachable) */}
            {!authTimedOut && (
              <>
                {/* Toggle Admin Override */}
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="btn-ghost mt-2 w-full justify-center text-sm active:scale-95 touch-action-manipulation"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {t("auth.adminOverride")}
                  {showPasswordForm ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Password Form */}
                {showPasswordForm && (
                  <div className="mt-4 animate-scale-in space-y-3">
                    <div className="space-y-0.5">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                        {t("auth.email")}
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                          type="email"
                          className="w-full rounded-xl border border-border bg-bg-glass py-2.5 ps-10 pe-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-accent/50 focus:bg-bg-card focus:shadow-[0_0_12px_rgba(34,197,94,0.06)]"
                          placeholder={t("auth.emailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                        {t("auth.password")}
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                          type="password"
                          placeholder={t("auth.passwordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-border bg-bg-glass py-2.5 ps-10 pe-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-accent/50 focus:bg-bg-card focus:shadow-[0_0_12px_rgba(34,197,94,0.06)]"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        {passwordError}
                      </p>
                    )}

                    <button
                      onClick={handlePasswordSignIn}
                      disabled={passwordBusy || !email.trim() || !password.trim()}
                      className="btn-secondary w-full py-2.5 text-sm active:scale-[0.98] touch-action-manipulation"
                    >
                      {passwordBusy ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                          {t("auth.signingIn")}
                        </span>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          {t("auth.signIn")}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated ──
  return (
    <>
      {/* Guest mode banner — subtle, dismissible */}
      {guestMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/10 px-4 py-1.5 text-center">
          <p className="text-[11px] tracking-wide text-amber-400/70">
            {t("auth.guestMode")}{' '}
            <button
              onClick={() => {
                localStorage.removeItem(GUEST_KEY)
                setGuestMode(false)
                setAuthed(false)
              }}
              className="underline underline-offset-2 hover:text-amber-300 transition-colors active:scale-95 touch-action-manipulation"
            >
              {t("auth.authenticateLink")}
            </button>
          </p>
        </div>
      )}

      {/* Shift content down to account for guest banner */}
      <div className={guestMode ? "pt-8" : ""}>
        {children}
      </div>
    </>
  )
}
