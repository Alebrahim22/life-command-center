"use client"

import { Suspense } from "react"
import Section from "@/components/Section"
import Grid from "@/components/Grid"
import UpcomingBills from "@/components/UpcomingBills"
import WarrantyChecker from "@/components/WarrantyChecker"
import { LegalCases, BillsTracker, BudgetSnapshot } from "@/components/lazy-widgets"
import WidgetSkeleton from "@/components/WidgetSkeleton"

// ================================================================
// 🛡️ Desk: The Vault
// ================================================================

export default function VaultDesk() {
  return (
    <div className="space-y-4">
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <LegalCases />
        </Suspense>
      </Section>
      <Grid>
        <Suspense fallback={<WidgetSkeleton />}>
          <BillsTracker />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <BudgetSnapshot />
        </Suspense>
      </Grid>
      <Grid>
        <UpcomingBills />
        <WarrantyChecker />
      </Grid>
    </div>
  )
}
