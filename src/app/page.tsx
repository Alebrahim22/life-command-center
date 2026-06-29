"use client"

import AuthGuard from "@/components/AuthGuard"
import CommandCenter from "@/components/CommandCenter"

export default function Home() {
  return (
    <AuthGuard>
      <CommandCenter />
    </AuthGuard>
  )
}
