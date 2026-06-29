"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Fingerprint, ChevronDown, ChevronUp, Lock, Mail, ShieldCheck } from "lucide-react"

interface Props {
  children: React.ReactNode
}

export default function AuthGuard({ children }: Props) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [showBg, setShowBg] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setChecking(false)
      // Trigger entrance animation
      requestAnimationFrame(() => setShowBg(true))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setAuthed(true)
        setBusy(false)
        setPasswordBusy(false)
      }
      if (event === "SIGNED_OUT") {
        setAuthed(false)
      }
    })

    return () => subscription.unsubscribe()
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

  // Loading state — premium spinner
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

  // Auth screen
  if (!authed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg-primary">
        {/* Animated Background Elements */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            showBg ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Radial glow */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)",
            }}
          />
          
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Floating orbs */}
          <div
            className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-[100px] animate-fade-in"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          />
          <div
            className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-accent-gold/5 blur-[120px] animate-fade-in"
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
                Command Center
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                Biometric authentication required
              </p>
            </div>

            {/* Auth Button — Premium */}
            <button
              onClick={handleAuth}
              disabled={busy}
              className="btn-primary w-full py-3 text-base"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5" />
                  Authenticate Command Center
                </>
              )}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-widest text-text-muted">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Toggle Admin Override */}
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="btn-ghost w-full justify-center text-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Override
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
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg-glass py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-accent/50 focus:bg-bg-card focus:shadow-[0_0_12px_rgba(34,197,94,0.06)]"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg-glass py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-accent/50 focus:bg-bg-card focus:shadow-[0_0_12px_rgba(34,197,94,0.06)]"
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
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  {passwordBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
