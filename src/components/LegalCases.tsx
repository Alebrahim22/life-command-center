"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface HistoryEntry {
  id?: string
  date: string
  text: string
}

interface LegalCase {
  id: string
  caseNumber: string
  title: string
  role: "Plaintiff" | "Defendant"
  court: string
  stage: "Filed" | "Under Review" | "Hearing Scheduled" | "Awaiting Judgment" | "Appealed" | "Closed" | "Won" | "Lost"
  nextSessionDate: string | null
  nextSessionTime: string | null
  notes: string
  history: HistoryEntry[]
}

const STAGES: LegalCase["stage"][] = [
  "Filed", "Under Review", "Hearing Scheduled", "Awaiting Judgment",
  "Appealed", "Closed", "Won", "Lost",
]

const stageColors: Record<string, string> = {
  Filed: "bg-blue-500/20 text-blue-400",
  "Under Review": "bg-amber-500/20 text-amber-400",
  "Hearing Scheduled": "bg-orange-500/20 text-orange-400",
  "Awaiting Judgment": "bg-purple-500/20 text-purple-400",
  Appealed: "bg-red-500/20 text-red-400",
  Closed: "bg-text-secondary/20 text-text-secondary",
  Won: "bg-accent/20 text-accent",
  Lost: "bg-red-700/20 text-red-400",
}

const CLOSED_STATUSES = ["Closed", "Won", "Lost"]

function todayStr(): string {
  return new Date().toISOString().split("T")[0]
}

function in7Days(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split("T")[0]
}

export default function LegalCases() {
  const [cases, setCases] = useState<LegalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const [num, setNum] = useState("")
  const [title, setTitle] = useState("")
  const [role, setRole] = useState<"Plaintiff" | "Defendant">("Plaintiff")
  const [court, setCourt] = useState("")
  const [stage, setStage] = useState<LegalCase["stage"]>("Filed")
  const [sessionDate, setSessionDate] = useState("")
  const [sessionTime, setSessionTime] = useState("")

  const [addHistoryFor, setAddHistoryFor] = useState<string | null>(null)
  const [historyText, setHistoryText] = useState("")

  const [editNotes, setEditNotes] = useState<string | null>(null)

  useEffect(() => {
    fetchCases()
  }, [])

  async function fetchCases() {
    const [casesRes, logsRes] = await Promise.all([
      supabase.from("legal_cases").select("*").order("next_session_date", { ascending: true, nullsFirst: false }),
      supabase.from("legal_case_logs").select("*").order("log_date", { ascending: true }),
    ])

    const logsByCase: Record<string, HistoryEntry[]> = {}
    if (logsRes.data) {
      for (const log of logsRes.data) {
        if (!logsByCase[log.case_id]) logsByCase[log.case_id] = []
        logsByCase[log.case_id].push({
          id: log.id,
          date: log.log_date,
          text: log.log_text,
        })
      }
    }

    if (casesRes.data) {
      const mapped = casesRes.data.map((r: any) => ({
        id: r.id,
        caseNumber: r.case_number,
        title: r.title,
        role: r.role,
        court: r.court,
        stage: r.stage,
        nextSessionDate: r.next_session_date,
        nextSessionTime: r.next_session_time,
        notes: r.notes ?? "",
        history: logsByCase[r.id] ?? [],
      }))

      setCases(mapped)

      const initCollapsed: Record<string, boolean> = {}
      for (const c of mapped) {
        if (CLOSED_STATUSES.includes(c.stage)) initCollapsed[c.id] = true
      }
      setCollapsed(initCollapsed)
    }

    setLoading(false)
  }

  async function addCase() {
    if (!num.trim() || !title.trim() || !court.trim()) return

    const { data, error } = await supabase
      .from("legal_cases")
      .insert({
        case_number: num.trim(),
        title: title.trim(),
        role,
        court: court.trim(),
        stage,
        next_session_date: sessionDate || null,
        next_session_time: sessionTime || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add case:", error)
      return
    }

    const c: LegalCase = {
      id: data.id,
      caseNumber: data.case_number,
      title: data.title,
      role: data.role,
      court: data.court,
      stage: data.stage,
      nextSessionDate: data.next_session_date,
      nextSessionTime: data.next_session_time,
      notes: data.notes ?? "",
      history: [],
    }

    setCases((prev) => [...prev, c])
    setNum("")
    setTitle("")
    setCourt("")
    setSessionDate("")
    setSessionTime("")
    setShowForm(false)
  }

  async function deleteCase(id: string) {
    const { error } = await supabase.from("legal_cases").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete case:", error)
      return
    }
    setCases((prev) => prev.filter((c) => c.id !== id))
  }

  async function updateCaseInDb(id: string, partial: Partial<LegalCase>) {
    const dbPayload: Record<string, any> = {}
    if (partial.stage) dbPayload.stage = partial.stage
    if (partial.nextSessionDate !== undefined) dbPayload.next_session_date = partial.nextSessionDate
    if (partial.nextSessionTime !== undefined) dbPayload.next_session_time = partial.nextSessionTime
    if (partial.notes !== undefined) dbPayload.notes = partial.notes

    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase.from("legal_cases").update(dbPayload).eq("id", id)
      if (error) console.error("Failed to update case:", error)
    }

    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function addHistory(caseId: string) {
    if (!historyText.trim()) return

    const { data, error } = await supabase
      .from("legal_case_logs")
      .insert({
        case_id: caseId,
        log_text: historyText.trim(),
        log_date: todayStr(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add history:", error)
      return
    }

    const entry: HistoryEntry = {
      id: data.id,
      date: data.log_date,
      text: data.log_text,
    }

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, history: [...c.history, entry] } : c,
      ),
    )
    setHistoryText("")
    setAddHistoryFor(null)
  }

  const today = todayStr()
  const weekEnd = in7Days()

  const sorted = [...cases].sort((a, b) => {
    if (!a.nextSessionDate && !b.nextSessionDate) return 0
    if (!a.nextSessionDate) return 1
    if (!b.nextSessionDate) return -1
    return a.nextSessionDate.localeCompare(b.nextSessionDate)
  })

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-secondary">Legal Cases</h2>
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-secondary">Legal Cases</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
        >
          {showForm ? "Cancel" : "+ Case"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-bg-card-hover p-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Case #" value={num} onChange={(e) => setNum(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            <select value={role} onChange={(e) => setRole(e.target.value as "Plaintiff" | "Defendant")} className="rounded-lg border border-border bg-bg-card px-2 py-2 text-sm text-text-primary outline-none">
              <option value="Plaintiff">Plaintiff</option>
              <option value="Defendant">Defendant</option>
            </select>
          </div>
          <input type="text" placeholder="Case title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
          <div className="flex gap-2">
            <input type="text" placeholder="Court name" value={court} onChange={(e) => setCourt(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none" />
            <select value={stage} onChange={(e) => setStage(e.target.value as LegalCase["stage"])} className="rounded-lg border border-border bg-bg-card px-2 py-2 text-sm text-text-primary outline-none">
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none [color-scheme:dark]" />
            <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none [color-scheme:dark]" />
          </div>
          <button onClick={addCase} className="w-full rounded-lg bg-accent/20 py-2 text-sm font-medium text-accent">Add Case</button>
        </div>
      )}

      {sorted.length === 0 && (
        <p className="py-6 text-center text-sm text-text-secondary">No cases added yet</p>
      )}

      <div className="space-y-3">
        {sorted.map((c) => {
          const isClosed = CLOSED_STATUSES.includes(c.stage)
          const sessionSoon = c.nextSessionDate && c.nextSessionDate >= today && c.nextSessionDate <= weekEnd
          const isCollapsed = collapsed[c.id] ?? isClosed

          return (
            <div
              key={c.id}
              className={`rounded-lg border border-border bg-bg-card-hover ${
                isClosed ? "opacity-60" : ""
              } ${sessionSoon ? "border-amber-500" : ""}`}
            >
              <button
                onClick={() => toggleCollapse(c.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{c.title}</p>
                  <p className="text-[10px] text-text-secondary">{c.caseNumber} · {c.court}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${stageColors[c.stage]}`}>{c.stage}</span>
                <span className="text-[10px] text-text-secondary">{c.role}</span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <select value={c.stage} onChange={(e) => updateCaseInDb(c.id, { stage: e.target.value as LegalCase["stage"] })} className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none">
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" value={c.nextSessionDate || ""} onChange={(e) => updateCaseInDb(c.id, { nextSessionDate: e.target.value || null })} className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none [color-scheme:dark]" />
                    <input type="time" value={c.nextSessionTime || ""} onChange={(e) => updateCaseInDb(c.id, { nextSessionTime: e.target.value || null })} className="rounded-lg border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none [color-scheme:dark]" />
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">History Log</span>
                    <div className="mt-1 space-y-1">
                      {c.history.map((h, i) => (
                        <div key={h.id ?? i} className="flex gap-2 text-xs text-text-secondary">
                          <span className="shrink-0 text-text-secondary">{h.date}</span>
                          <span>{h.text}</span>
                        </div>
                      ))}
                      {c.history.length === 0 && <p className="text-xs text-text-secondary">No history entries</p>}
                    </div>
                    {addHistoryFor === c.id ? (
                      <div className="mt-2 flex gap-2">
                        <input type="text" placeholder="What happened?" value={historyText} onChange={(e) => setHistoryText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHistory(c.id)} className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs text-text-primary placeholder-text-secondary outline-none" />
                        <button onClick={() => addHistory(c.id)} className="rounded bg-accent/20 px-3 text-xs font-medium text-accent">Log</button>
                        <button onClick={() => setAddHistoryFor(null)} className="text-xs text-text-secondary">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddHistoryFor(c.id); setHistoryText("") }} className="mt-1 flex items-center gap-1 text-xs text-accent">
                        <Plus className="h-3 w-3" /> Add Entry
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">Notes</span>
                    {editNotes === c.id ? (
                      <div className="mt-1">
                        <textarea value={c.notes} onChange={(e) => updateCaseInDb(c.id, { notes: e.target.value })} className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none" rows={3} />
                        <button onClick={() => setEditNotes(null)} className="mt-1 rounded bg-accent/20 px-3 py-1 text-xs font-medium text-accent">Done</button>
                      </div>
                    ) : (
                      <div onClick={() => setEditNotes(c.id)} className="mt-1 cursor-text rounded-lg bg-bg-card px-3 py-2 text-sm text-text-secondary">
                        {c.notes || "Click to add notes..."}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button onClick={() => deleteCase(c.id)} className="flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-300">
                      <Trash2 className="h-3 w-3" /> Delete Case
                    </button>
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
