"use client"

import { useState } from "react"
import AuthGuard from "@/components/AuthGuard"
import CommandCenter from "@/components/CommandCenter"
import Onboarding, { useOnboarding } from "@/components/Onboarding"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function Home() {
  const needsOnboarding = useOnboarding()
  const [onboarded, setOnboarded] = useState(false)

  if (needsOnboarding && !onboarded) {
    return <Onboarding onFinish={() => setOnboarded(true)} />
  }

  return (
    <AuthGuard>
      <ErrorBoundary>
        <CommandCenter />
      </ErrorBoundary>
    </AuthGuard>
  )
}
