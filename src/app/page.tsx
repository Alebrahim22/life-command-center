"use client"

import { useState } from "react"
import AuthGuard from "@/components/AuthGuard"
import CommandCenter from "@/components/CommandCenter"
import Onboarding, { useOnboarding } from "@/components/Onboarding"

export default function Home() {
  const needsOnboarding = useOnboarding()
  const [onboarded, setOnboarded] = useState(false)

  if (needsOnboarding && !onboarded) {
    return <Onboarding onFinish={() => setOnboarded(true)} />
  }

  return (
    <AuthGuard>
      <CommandCenter />
    </AuthGuard>
  )
}
