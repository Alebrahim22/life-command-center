"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react"

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

const STORAGE_KEY = "projects-data"

const PROJECT_NAMES = ["Hadeya", "Reluxx", "Osoul", "XYZ Agency", "Personal Brand"]

const statusColors: Record<ProjectStatus, string> = {
  Active: "bg-[#22c55e] bg-opacity-20 text-[#22c55e]",
  "On Hold": "bg-amber-500 bg-opacity-20 text-amber-400",
  Launched: "bg-blue-500 bg-opacity-20 text-blue-400",
  Archived: "bg-[#555] bg-opacity-20 text-[#888]",
}

const stageColors: Record<ProjectStage, string> = {
  Idea: "bg-[#555] bg-opacity-20 text-[#888]",
  Building: "bg-blue-500 bg-opacity-20 text-blue-400",
  Beta: "bg-amber-500 bg-opacity-20 text-amber-400",
  Live: "bg-[#22c55e] bg-opacity-20 text-[#22c55e]",
  Scaling: "bg-purple-500 bg-opacity-20 text-purple-400",
}

function defaultProject(): Project {
  return {
    status: "Active",
    stage: "Idea",
    kpis: [],
    notes: "",
    milestones: [],
    collapsed: false,
  }
}

function defaultData(): ProjectsData {
  return Object.fromEntries(PROJECT_NAMES.map((n) => [n, defaultProject()]))
}

function load(): ProjectsData {
  if (typeof window === "undefined") return defaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const merged = { ...defaultData() }
      for (const name of PROJECT_NAMES) {
        if (parsed[name]) {
          merged[name] = { ...defaultProject(), ...parsed[name] }
        }
      }
      return merged
    }
  } catch {}
  return defaultData()
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
  const [data, setData] = useState<ProjectsData>(defaultData())
  const [loaded, setLoaded] = useState(false)

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
    setData(load())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, loaded])

  function updateProject(name: string, partial: Partial<Project>) {
    setData((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...partial },
    }))
  }

  function toggleCollapse(name: string) {
    updateProject(name, { collapsed: !data[name].collapsed })
  }

  function addKpi(projectName: string) {
    const target = parseFloat(kpiTarget)
    const current = parseFloat(kpiCurrent)
    if (!kpiName.trim() || isNaN(target) || isNaN(current)) return
    const kpi: KPI = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: kpiName.trim(),
      currentValue: current,
      targetValue: target,
      unit: kpiUnit.trim(),
    }
    updateProject(projectName, { kpis: [...data[projectName].kpis, kpi] })
    setKpiName("")
    setKpiTarget("")
    setKpiUnit("")
    setKpiCurrent("")
    setEditKpiProject(null)
  }

  function removeKpi(projectName: string, kpiId: string) {
    updateProject(projectName, {
      kpis: data[projectName].kpis.filter((k) => k.id !== kpiId),
    })
  }

  function addMilestone(projectName: string) {
    if (!msTitle.trim() || !msDate) return
    if (data[projectName].milestones.length >= 5) return
    const ms: Milestone = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: msTitle.trim(),
      dueDate: msDate,
      done: false,
    }
    updateProject(projectName, { milestones: [...data[projectName].milestones, ms] })
    setMsTitle("")
    setMsDate("")
    setEditMilestoneProject(null)
  }

  function toggleMilestone(projectName: string, msId: string) {
    updateProject(projectName, {
      milestones: data[projectName].milestones.map((m) =>
        m.id === msId ? { ...m, done: !m.done } : m,
      ),
    })
  }

  function removeMilestone(projectName: string, msId: string) {
    updateProject(projectName, {
      milestones: data[projectName].milestones.filter((m) => m.id !== msId),
    })
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

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Projects</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#a0a0a0]">Projects</h2>

      <div className="mb-4 flex gap-4 text-sm">
        <div className="rounded-lg bg-[#222] px-4 py-2">
          <span className="text-[#a0a0a0]">Active: </span>
          <span className="font-semibold text-[#22c55e]">{activeCount}</span>
        </div>
        <div className="rounded-lg bg-[#222] px-4 py-2">
          <span className="text-[#a0a0a0]">Milestones due this week: </span>
          <span className="font-semibold text-amber-400">{milestonesDueThisWeek}</span>
        </div>
      </div>

      <div className="space-y-3">
        {PROJECT_NAMES.map((name) => {
          const proj = data[name]
          return (
            <div
              key={name}
              className="rounded-lg border border-[#2a2a2a] bg-[#222]"
            >
              <button
                onClick={() => toggleCollapse(name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {proj.collapsed ? (
                  <ChevronRight className="h-4 w-4 text-[#a0a0a0]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
                )}
                <span className="flex-1 text-sm font-medium text-white">{name}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${statusColors[proj.status]}`}>
                  {proj.status}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${stageColors[proj.stage]}`}>
                  {proj.stage}
                </span>
              </button>

              {!proj.collapsed && (
                <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3">
                  <div className="mb-3 flex gap-2">
                    <select
                      value={proj.status}
                      onChange={(e) => updateProject(name, { status: e.target.value as ProjectStatus })}
                      className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none"
                    >
                      {(["Active", "On Hold", "Launched", "Archived"] as ProjectStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={proj.stage}
                      onChange={(e) => updateProject(name, { stage: e.target.value as ProjectStage })}
                      className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none"
                    >
                      {(["Idea", "Building", "Beta", "Live", "Scaling"] as ProjectStage[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">KPIs</span>
                      {proj.kpis.length < 5 && (
                        <button
                          onClick={() => {
                            setEditKpiProject(name)
                            setKpiName("")
                            setKpiTarget("")
                            setKpiUnit("")
                            setKpiCurrent("")
                          }}
                          className="flex items-center gap-1 text-xs text-[#22c55e]"
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
                            <div key={kpi.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#1a1a1a]">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-[#e0e0e0]">{kpi.name}</span>
                                  <span className="text-xs text-[#a0a0a0]">
                                    {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                                  </span>
                                </div>
                                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                                  <div
                                    className="h-full rounded-full bg-[#22c55e]"
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
                      <p className="text-xs text-[#666]">No KPIs set</p>
                    )}
                    {editKpiProject === name && (
                      <div className="mt-2 grid grid-cols-5 gap-2 rounded-lg bg-[#1a1a1a] p-2">
                        <input type="text" placeholder="Name" value={kpiName} onChange={(e) => setKpiName(e.target.value)} className="col-span-1 rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white placeholder-[#666] outline-none" />
                        <input type="number" placeholder="Current" value={kpiCurrent} onChange={(e) => setKpiCurrent(e.target.value)} className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white placeholder-[#666] outline-none" />
                        <input type="number" placeholder="Target" value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white placeholder-[#666] outline-none" />
                        <input type="text" placeholder="Unit" value={kpiUnit} onChange={(e) => setKpiUnit(e.target.value)} className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white placeholder-[#666] outline-none" />
                        <button onClick={() => addKpi(name)} className="rounded bg-[#22c55e] bg-opacity-20 text-xs font-medium text-[#22c55e]">Add</button>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Milestones</span>
                      {proj.milestones.length < 5 && (
                        <button
                          onClick={() => {
                            setEditMilestoneProject(name)
                            setMsTitle("")
                            setMsDate("")
                          }}
                          className="flex items-center gap-1 text-xs text-[#22c55e]"
                        >
                          <Plus className="h-3 w-3" /> Add Milestone
                        </button>
                      )}
                    </div>
                    {proj.milestones.map((ms) => (
                      <div key={ms.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#1a1a1a]">
                        <input type="checkbox" checked={ms.done} onChange={() => toggleMilestone(name, ms.id)} className="h-3.5 w-3.5 cursor-pointer accent-[#22c55e]" />
                        <span className={`flex-1 text-sm ${ms.done ? "text-[#555] line-through" : "text-[#c0c0c0]"}`}>{ms.title}</span>
                        <span className="text-[10px] text-[#666]">{ms.dueDate}</span>
                        <button onClick={() => removeMilestone(name, ms.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                    {proj.milestones.length === 0 && (
                      <p className="text-xs text-[#666]">No milestones</p>
                    )}
                    {editMilestoneProject === name && (
                      <div className="mt-2 flex gap-2 rounded-lg bg-[#1a1a1a] p-2">
                        <input type="text" placeholder="Title" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} className="flex-1 rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white placeholder-[#666] outline-none" />
                        <input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="rounded border border-[#2a2a2a] bg-[#222] px-2 py-1 text-xs text-white outline-none [color-scheme:dark]" />
                        <button onClick={() => addMilestone(name)} className="rounded bg-[#22c55e] bg-opacity-20 px-2 text-xs font-medium text-[#22c55e]">Add</button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Notes</span>
                    {editNotes === name ? (
                      <div className="mt-1">
                        <textarea
                          value={proj.notes}
                          onChange={(e) => updateProject(name, { notes: e.target.value })}
                          className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
                          rows={3}
                        />
                        <button onClick={() => setEditNotes(null)} className="mt-1 rounded bg-[#22c55e] bg-opacity-20 px-3 py-1 text-xs font-medium text-[#22c55e]">Done</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditNotes(name)}
                        className="mt-1 cursor-text rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm text-[#a0a0a0]"
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
