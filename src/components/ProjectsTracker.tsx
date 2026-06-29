"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"
import Checkbox from "@/components/Checkbox"
import { supabase } from "@/lib/supabase"

type ProjectStatus = "Active" | "On Hold" | "Launched" | "Archived"
type ProjectStage = "Idea" | "Building" | "Beta" | "Live" | "Scaling"

interface KPI {
  id: string
  name: string
  currentValue: number
  targetValue: number
  unit: string
}

interface Milestone {
  id: string
  title: string
  dueDate: string
  done: boolean
}

interface Project {
  id: string
  status: ProjectStatus
  stage: ProjectStage
  kpis: KPI[]
  notes: string
  milestones: Milestone[]
  collapsed: boolean
}

interface ProjectsData {
  [key: string]: Project
}

const PROJECT_NAMES = ["Hadeya", "Reluxx", "Osoul", "XYZ Agency", "Personal Brand"]

const statusColors: Record<ProjectStatus, string> = {
  Active: "bg-accent/20 text-accent",
  "On Hold": "bg-amber-500/20 text-amber-400",
  Launched: "bg-blue-500/20 text-blue-400",
  Archived: "bg-text-secondary/20 text-text-secondary",
}

const stageColors: Record<ProjectStage, string> = {
  Idea: "bg-text-secondary/20 text-text-secondary",
  Building: "bg-blue-500/20 text-blue-400",
  Beta: "bg-amber-500/20 text-amber-400",
  Live: "bg-accent/20 text-accent",
  Scaling: "bg-purple-500/20 text-purple-400",
}

function defaultProject(id: string): Project {
  return {
    id,
    status: "Active",
    stage: "Idea",
    kpis: [],
    notes: "",
    milestones: [],
    collapsed: false,
  }
}

function weekBounds(): [string, string] {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [monday.toISOString().split("T")[0], sunday.toISOString().split("T")[0]]
}

function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

export default function ProjectsTracker() {
  const [data, setData] = useState<ProjectsData>({})
  const [loading, setLoading] = useState(true)

  const [editKpiProject, setEditKpiProject] = useState<string | null>(null)
  const [kpiName, setKpiName] = useState("")
  const [kpiTarget, setKpiTarget] = useState("")
  const [kpiUnit, setKpiUnit] = useState("")
  const [kpiCurrent, setKpiCurrent] = useState("")

  const [editMilestoneProject, setEditMilestoneProject] = useState<string | null>(null)
  const [msTitle, setMsTitle] = useState("")
  const [msDate, setMsDate] = useState("")

  const [editNotes, setEditNotes] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const [projRes, kpisRes, msRes] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("project_kpis").select("*"),
      supabase.from("project_milestones").select("*"),
    ])

    const map: ProjectsData = {}

    if (projRes.data) {
      for (const p of projRes.data) {
        const name = p.name
        if (!PROJECT_NAMES.includes(name)) continue
        map[name] = {
          id: p.id,
          status: p.status,
          stage: p.stage,
          notes: p.notes ?? "",
          kpis: [],
          milestones: [],
          collapsed: false,
        }

        if (kpisRes.data) {
          map[name].kpis = kpisRes.data
            .filter((k: any) => k.project_id === p.id)
            .map((k: any) => ({
              id: k.id,
              name: k.name,
              currentValue: Number(k.current_value),
              targetValue: Number(k.target_value),
              unit: k.unit,
            }))
        }

        if (msRes.data) {
          map[name].milestones = msRes.data
            .filter((m: any) => m.project_id === p.id)
            .map((m: any) => ({
              id: m.id,
              title: m.title,
              dueDate: m.due_date,
              done: m.done,
            }))
        }
      }
    }

    for (const n of PROJECT_NAMES) {
      if (!map[n]) map[n] = defaultProject("")
    }

    setData(map)
    setLoading(false)
  }

  async function updateProjectInDb(name: string, partial: Partial<Project>) {
    const projectId = data[name]?.id
    if (!projectId) return

    const dbPayload: Record<string, any> = {}
    if (partial.status) dbPayload.status = partial.status
    if (partial.stage) dbPayload.stage = partial.stage
    if (partial.notes !== undefined) dbPayload.notes = partial.notes

    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase.from("projects").update(dbPayload).eq("id", projectId)
      if (error) console.error("Failed to update project:", error)
    }

    setData((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...partial },
    }))
  }

  function toggleCollapse(name: string) {
    setData((prev) => ({
      ...prev,
      [name]: { ...prev[name], collapsed: !prev[name].collapsed },
    }))
  }

  async function addKpi(projectName: string) {
    const target = parseFloat(kpiTarget)
    const current = parseFloat(kpiCurrent)
    if (!kpiName.trim() || isNaN(target) || isNaN(current)) return

    const projectId = data[projectName]?.id
    if (!projectId) return

    const { data: inserted, error } = await supabase
      .from("project_kpis")
      .insert({
        project_id: projectId,
        name: kpiName.trim(),
        current_value: current,
        target_value: target,
        unit: kpiUnit.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add KPI:", error)
      return
    }

    const kpi: KPI = {
      id: inserted.id,
      name: inserted.name,
      currentValue: Number(inserted.current_value),
      targetValue: Number(inserted.target_value),
      unit: inserted.unit,
    }

    setData((prev) => ({
      ...prev,
      [projectName]: { ...prev[projectName], kpis: [...prev[projectName].kpis, kpi] },
    }))
    setKpiName("")
    setKpiTarget("")
    setKpiUnit("")
    setKpiCurrent("")
    setEditKpiProject(null)
  }

  async function removeKpi(projectName: string, kpiId: string) {
    const { error } = await supabase.from("project_kpis").delete().eq("id", kpiId)
    if (error) {
      console.error("Failed to remove KPI:", error)
      return
    }
    setData((prev) => ({
      ...prev,
      [projectName]: { ...prev[projectName], kpis: prev[projectName].kpis.filter((k) => k.id !== kpiId) },
    }))
  }

  async function addMilestone(projectName: string) {
    if (!msTitle.trim() || !msDate) return
    if (data[projectName].milestones.length >= 5) return

    const projectId = data[projectName]?.id
    if (!projectId) return

    const { data: inserted, error } = await supabase
      .from("project_milestones")
      .insert({
        project_id: projectId,
        title: msTitle.trim(),
        due_date: msDate,
        done: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add milestone:", error)
      return
    }

    const ms: Milestone = {
      id: inserted.id,
      title: inserted.title,
      dueDate: inserted.due_date,
      done: inserted.done,
    }

    setData((prev) => ({
      ...prev,
      [projectName]: { ...prev[projectName], milestones: [...prev[projectName].milestones, ms] },
    }))
    setMsTitle("")
    setMsDate("")
    setEditMilestoneProject(null)
  }

  async function toggleMilestone(projectName: string, msId: string) {
    const ms = data[projectName]?.milestones.find((m) => m.id === msId)
    if (!ms) return

    const { error } = await supabase
      .from("project_milestones")
      .update({ done: !ms.done })
      .eq("id", msId)

    if (error) {
      console.error("Failed to toggle milestone:", error)
      return
    }

    setData((prev) => ({
      ...prev,
      [projectName]: {
        ...prev[projectName],
        milestones: prev[projectName].milestones.map((m) =>
          m.id === msId ? { ...m, done: !m.done } : m,
        ),
      },
    }))
  }

  async function removeMilestone(projectName: string, msId: string) {
    const { error } = await supabase.from("project_milestones").delete().eq("id", msId)
    if (error) {
      console.error("Failed to remove milestone:", error)
      return
    }
    setData((prev) => ({
      ...prev,
      [projectName]: {
        ...prev[projectName],
        milestones: prev[projectName].milestones.filter((m) => m.id !== msId),
      },
    }))
  }

  async function saveNotes(name: string) {
    await updateProjectInDb(name, { notes: data[name].notes })
    setEditNotes(null)
  }

  const [weekStart, weekEnd] = weekBounds()

  const activeCount = Object.values(data).filter((p) => p.status === "Active").length

  let milestonesDueThisWeek = 0
  for (const p of Object.values(data)) {
    for (const m of p.milestones) {
      if (!m.done && isDateInRange(m.dueDate, weekStart, weekEnd)) {
        milestonesDueThisWeek++
      }
    }
  }

  if (loading) {
    return (
      <div className="glass-card-static p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Projects</h2>
        <div className="h-48 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 glass-card-static p-5 transition-all duration-300">
      <h2 className="mb-4 text-lg font-semibold text-text-secondary">Projects</h2>

      <div className="mb-4 flex gap-4 text-sm">
        <div className="rounded-lg bg-bg-card-hover px-4 py-2">
          <span className="text-text-secondary">Active: </span>
          <span className="font-semibold text-accent">{activeCount}</span>
        </div>
        <div className="rounded-lg bg-bg-card-hover px-4 py-2">
          <span className="text-text-secondary">Milestones due this week: </span>
          <span className="font-semibold text-amber-400">{milestonesDueThisWeek}</span>
        </div>
      </div>

      <div className="space-y-3">
        {PROJECT_NAMES.map((name) => {
          const proj = data[name]
          if (!proj) return null
          return (
            <div
              key={name}
              className="rounded-lg border border-border bg-bg-card-hover"
            >
              <button
                onClick={() => toggleCollapse(name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {proj.collapsed ? (
                  <ChevronRight className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
                <span className="flex-1 text-sm font-medium text-text-primary">{name}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${statusColors[proj.status]}`}>
                  {proj.status}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${stageColors[proj.stage]}`}>
                  {proj.stage}
                </span>
              </button>

              {!proj.collapsed && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="mb-3 flex gap-2">
                    <select
                      value={proj.status}
                      onChange={(e) => updateProjectInDb(name, { status: e.target.value as ProjectStatus })}
                      className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none"
                    >
                      {(["Active", "On Hold", "Launched", "Archived"] as ProjectStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={proj.stage}
                      onChange={(e) => updateProjectInDb(name, { stage: e.target.value as ProjectStage })}
                      className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none"
                    >
                      {(["Idea", "Building", "Beta", "Live", "Scaling"] as ProjectStage[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">KPIs</span>
                      {proj.kpis.length < 5 && (
                        <button
                          onClick={() => {
                            setEditKpiProject(name)
                            setKpiName("")
                            setKpiTarget("")
                            setKpiUnit("")
                            setKpiCurrent("")
                          }}
                          className="flex items-center gap-1 text-xs text-accent"
                        >
                          <Plus className="h-3 w-3" /> Add KPI
                        </button>
                      )}
                    </div>
                    {proj.kpis.length > 0 && (
                      <div className="space-y-1">
                        {proj.kpis.map((kpi) => {
                          const pct = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0
                          return (
                            <div key={kpi.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-card">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-text-primary">{kpi.name}</span>
                                  <span className="text-xs text-text-secondary">
                                    {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                                  </span>
                                </div>
                                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                              </div>
                              <button onClick={() => removeKpi(name, kpi.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {proj.kpis.length === 0 && (
                      <div className="flex items-center gap-3 rounded-lg bg-bg-card/50 px-3 py-2">
                        <span className="text-lg">🎯</span>
                        <div>
                          <p className="text-xs font-medium text-text-primary">No KPIs set</p>
                          <p className="text-[10px] text-text-secondary">Add key performance indicators for this project.</p>
                        </div>
                      </div>
                    )}
                    {editKpiProject === name && (
                      <div className="mt-2 grid grid-cols-5 gap-2 rounded-lg bg-bg-card p-2">
                        <input type="text" placeholder="Name" value={kpiName} onChange={(e) => setKpiName(e.target.value)} className="col-span-1 rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <input type="number" placeholder="Current" value={kpiCurrent} onChange={(e) => setKpiCurrent(e.target.value)} className="rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <input type="number" placeholder="Target" value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} className="rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <input type="text" placeholder="Unit" value={kpiUnit} onChange={(e) => setKpiUnit(e.target.value)} className="rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <button onClick={() => addKpi(name)} className="rounded bg-accent/20 text-xs font-medium text-accent">Add</button>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Milestones</span>
                      {proj.milestones.length < 5 && (
                        <button
                          onClick={() => {
                            setEditMilestoneProject(name)
                            setMsTitle("")
                            setMsDate("")
                          }}
                          className="flex items-center gap-1 text-xs text-accent"
                        >
                          <Plus className="h-3 w-3" /> Add Milestone
                        </button>
                      )}
                    </div>
                    {proj.milestones.map((ms) => (
                      <div key={ms.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-card">
                        <Checkbox checked={ms.done} onChange={() => toggleMilestone(name, ms.id)} />
                        <span className={`flex-1 text-sm ${ms.done ? "text-text-secondary/60 line-through" : "text-text-secondary"}`}>{ms.title}</span>
                        <span className="text-[10px] text-text-secondary">{ms.dueDate}</span>
                        <button onClick={() => removeMilestone(name, ms.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                    {proj.milestones.length === 0 && (
                      <div className="flex items-center gap-3 rounded-lg bg-bg-card/50 px-3 py-2">
                        <span className="text-lg">🏁</span>
                        <div>
                          <p className="text-xs font-medium text-text-primary">No milestones yet</p>
                          <p className="text-[10px] text-text-secondary">Break down the project into key milestones.</p>
                        </div>
                      </div>
                    )}
                    {editMilestoneProject === name && (
                      <div className="mt-2 flex gap-2 rounded-lg bg-bg-card p-2">
                        <input type="text" placeholder="Title" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} className="flex-1 rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="rounded border border-border bg-bg-card-hover px-2 py-1 text-xs text-text-primary outline-none" />
                        <button onClick={() => addMilestone(name)} className="rounded bg-accent/20 px-2 text-xs font-medium text-accent">Add</button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Notes</span>
                    {editNotes === name ? (
                      <div className="mt-1">
                        <textarea
                          value={proj.notes}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              [name]: { ...prev[name], notes: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none"
                          rows={3}
                        />
                        <button onClick={() => saveNotes(name)} className="mt-1 rounded bg-accent/20 px-3 py-1 text-xs font-medium text-accent">Done</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditNotes(name)}
                        className="mt-1 cursor-text rounded-lg bg-bg-card px-3 py-2 text-sm text-text-secondary"
                      >
                        {proj.notes || "Click to add notes..."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
