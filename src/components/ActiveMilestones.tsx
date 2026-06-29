"use client"

import { useState, useEffect } from "react"
import { Target } from "lucide-react"
import MiniCard from "@/components/MiniCard"
import Skeleton from "@/components/Skeleton"
import { supabase } from "@/lib/supabase"
import { Milestone, PROJECT_NAMES } from "@/lib/utils"

// ================================================================
// 🏆 Active Milestones
// ================================================================

export default function ActiveMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      PROJECT_NAMES.map(async (name) => {
        const { data: proj } = await supabase.from("projects").select("id").eq("name", name).maybeSingle()
        if (!proj) return null
        const { data: ms } = await supabase
          .from("project_milestones")
          .select("title, due_date, done")
          .eq("project_id", proj.id)
          .eq("done", false)
          .order("due_date", { ascending: true })
          .limit(1)
        if (!ms || ms.length === 0) return null
        return { projectName: name, title: ms[0].title, dueDate: ms[0].due_date, done: ms[0].done }
      }),
    ).then((results) => {
      setMilestones(results.filter((r): r is Milestone => r !== null))
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-48" />

  return (
    <MiniCard title="Next Milestones">
      {milestones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Target className="h-6 w-6 text-text-muted/40" />
          <p className="text-sm text-text-muted">No active milestones</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {milestones.map((m) => (
            <div
              key={m.projectName}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <Target className="h-3.5 w-3.5 shrink-0 text-accent-gold/60" />
              <span className="flex-1 truncate text-sm text-text-primary">{m.title}</span>
              <span className="shrink-0 text-[11px] font-mono text-accent-gold/50">{m.projectName}</span>
              <span className="shrink-0 text-[11px] font-mono text-text-muted">{m.dueDate}</span>
            </div>
          ))}
        </div>
      )}
    </MiniCard>
  )
}
