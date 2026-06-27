"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"

interface HistoryEntry {
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

const STORAGE_KEY = "legal-cases"

const STAGES: LegalCase["stage"][] = [
  "Filed", "Under Review", "Hearing Scheduled", "Awaiting Judgment",
  "Appealed", "Closed", "Won", "Lost",
]

const stageColors: Record<string, string> = {
  Filed: "bg-blue-500 bg-opacity-20 text-blue-400",
  "Under Review": "bg-amber-500 bg-opacity-20 text-amber-400",
  "Hearing Scheduled": "bg-orange-500 bg-opacity-20 text-orange-400",
  "Awaiting Judgment": "bg-purple-500 bg-opacity-20 text-purple-400",
  Appealed: "bg-red-500 bg-opacity-20 text-red-400",
  Closed: "bg-[#555] bg-opacity-20 text-[#888]",
  Won: "bg-[#22c55e] bg-opacity-20 text-[#22c55e]",
  Lost: "bg-red-700 bg-opacity-20 text-red-400",
}

const CLOSED_STATUSES = ["Closed", "Won", "Lost"]

function load(): LegalCase[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

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
  const [loaded, setLoaded] = useState(false)
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
    const d = load()
    setCases(d)
    const initCollapsed: Record<string, boolean> = {}
    for (const c of d) {
      if (CLOSED_STATUSES.includes(c.stage)) initCollapsed[c.id] = true
    }
    setCollapsed(initCollapsed)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  }, [cases, loaded])

  function addCase() {
    if (!num.trim() || !title.trim() || !court.trim()) return
    const c: LegalCase = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      caseNumber: num.trim(),
      title: title.trim(),
      role,
      court: court.trim(),
      stage,
      nextSessionDate: sessionDate || null,
      nextSessionTime: sessionTime || null,
      notes: "",
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

  function deleteCase(id: string) {
    setCases((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCase(id: string, partial: Partial<LegalCase>) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function addHistory(caseId: string) {
    if (!historyText.trim()) return
    const entry: HistoryEntry = {
      date: new Date().toISOString().split("T")[0],
      text: historyText.trim(),
    }
    updateCase(caseId, {
      history: [...(cases.find((c) => c.id === caseId)?.history || []), entry],
    })
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

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#a0a0a0]">Legal Cases</h2>
        <div className="h-32 animate-pulse rounded bg-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#a0a0a0]">Legal Cases</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[#22c55e] bg-opacity-20 px-3 py-1.5 text-xs font-medium text-[#22c55e] transition-colors hover:bg-opacity-30"
        >
          {showForm ? "Cancel" : "+ Case"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-[#222] p-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Case #" value={num} onChange={(e) => setNum(e.target.value)} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#666] outline-none" />
            <select value={role} onChange={(e) => setRole(e.target.value as "Plaintiff" | "Defendant")} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white outline-none">
              <option value="Plaintiff">Plaintiff</option>
              <option value="Defendant">Defendant</option>
            </select>
          </div>
          <input type="text" placeholder="Case title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#666] outline-none" />
          <div className="flex gap-2">
            <input type="text" placeholder="Court name" value={court} onChange={(e) => setCourt(e.target.value)} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#666] outline-none" />
            <select value={stage} onChange={(e) => setStage(e.target.value as LegalCase["stage"])} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white outline-none">
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
            <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
          </div>
          <button onClick={addCase} className="w-full rounded-lg bg-[#22c55e] bg-opacity-20 py-2 text-sm font-medium text-[#22c55e]">Add Case</button>
        </div>
      )}

      {sorted.length === 0 && (
        <p className="py-6 text-center text-sm text-[#666]">No cases added yet</p>
      )}

      <div className="space-y-3">
        {sorted.map((c) => {
          const isClosed = CLOSED_STATUSES.includes(c.stage)
          const sessionSoon = c.nextSessionDate && c.nextSessionDate >= today && c.nextSessionDate <= weekEnd
          const isCollapsed = collapsed[c.id] ?? isClosed

          return (
            <div
              key={c.id}
              className={`rounded-lg border border-[#2a2a2a] bg-[#222] ${
                isClosed ? "opacity-60" : ""
              } ${sessionSoon ? "border-amber-500" : ""}`}
            >
              <button
                onClick={() => toggleCollapse(c.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-[#a0a0a0]" /> : <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-[10px] text-[#666]">{c.caseNumber} · {c.court}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${stageColors[c.stage]}`}>{c.stage}</span>
                <span className="text-[10px] text-[#a0a0a0]">{c.role}</span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <select value={c.stage} onChange={(e) => updateCase(c.id, { stage: e.target.value as LegalCase["stage"] })} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none">
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" value={c.nextSessionDate || ""} onChange={(e) => updateCase(c.id, { nextSessionDate: e.target.value || null })} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none [color-scheme:dark]" />
                    <input type="time" value={c.nextSessionTime || ""} onChange={(e) => updateCase(c.id, { nextSessionTime: e.target.value || null })} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none [color-scheme:dark]" />
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">History Log</span>
                    <div className="mt-1 space-y-1">
                      {c.history.map((h, i) => (
                        <div key={i} className="flex gap-2 text-xs text-[#c0c0c0]">
                          <span className="shrink-0 text-[#666]">{h.date}</span>
                          <span>{h.text}</span>
                        </div>
                      ))}
                      {c.history.length === 0 && <p className="text-xs text-[#666]">No history entries</p>}
                    </div>
                    {addHistoryFor === c.id ? (
                      <div className="mt-2 flex gap-2">
                        <input type="text" placeholder="What happened?" value={historyText} onChange={(e) => setHistoryText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHistory(c.id)} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-xs text-white placeholder-[#666] outline-none" />
                        <button onClick={() => addHistory(c.id)} className="rounded bg-[#22c55e] bg-opacity-20 px-3 text-xs font-medium text-[#22c55e]">Log</button>
                        <button onClick={() => setAddHistoryFor(null)} className="text-xs text-[#666]">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddHistoryFor(c.id); setHistoryText("") }} className="mt-1 flex items-center gap-1 text-xs text-[#22c55e]">
                        <Plus className="h-3 w-3" /> Add Entry
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Notes</span>
                    {editNotes === c.id ? (
                      <div className="mt-1">
                        <textarea value={c.notes} onChange={(e) => updateCase(c.id, { notes: e.target.value })} className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none" rows={3} />
                        <button onClick={() => setEditNotes(null)} className="mt-1 rounded bg-[#22c55e] bg-opacity-20 px-3 py-1 text-xs font-medium text-[#22c55e]">Done</button>
                      </div>
                    ) : (
                      <div onClick={() => setEditNotes(c.id)} className="mt-1 cursor-text rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm text-[#a0a0a0]">
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
