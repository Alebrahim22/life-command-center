"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setChecking(false)
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

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg-primary px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Command Center</h1>
          <p className="mt-2 text-sm text-text-secondary">Biometric authentication required</p>
        </div>
        <button
          onClick={handleAuth}
          disabled={busy}
          className="rounded-xl border border-border bg-bg-card px-8 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover disabled:opacity-50"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Authenticating...
            </span>
          ) : (
            "Authenticate Command Center"
          )}
        </button>

        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="text-xs text-text-secondary underline-offset-2 hover:underline"
        >
          Use Admin Override Credentials
        </button>

        {showPasswordForm && (
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-border bg-bg-card p-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent"
            />
            {passwordError && (
              <p className="text-xs text-red-400">{passwordError}</p>
            )}
            <button
              onClick={handlePasswordSignIn}
              disabled={passwordBusy || !email.trim() || !password.trim()}
              className="rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover disabled:opacity-50"
            >
              {passwordBusy ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
