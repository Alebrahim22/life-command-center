"use client"

import { Suspense } from "react"
import Section from "@/components/Section"
import Grid from "@/components/Grid"
import TopTasks from "@/components/TopTasks"
import ActiveMilestones from "@/components/ActiveMilestones"
import { ShiftTracker, TodoList, HabitTracker, ProjectsTracker } from "@/components/lazy-widgets"
import WidgetSkeleton from "@/components/WidgetSkeleton"

// ================================================================
// 🏭 Desk: Operating
// ================================================================

export default function OperatingDesk() {
  return (
    <div className="space-y-4">
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <ShiftTracker />
        </Suspense>
      </Section>
      <Grid>
        <Suspense fallback={<WidgetSkeleton />}>
          <TodoList />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <HabitTracker />
        </Suspense>
      </Grid>
      <Grid>
        <TopTasks />
        <ActiveMilestones />
      </Grid>
      <Section>
        <Suspense fallback={<WidgetSkeleton />}>
          <ProjectsTracker />
        </Suspense>
      </Section>
    </div>
  )
}
