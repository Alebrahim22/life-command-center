"use client"

// ─── Types ───────────────────────────────────────────────────────

export interface Todo {
  id: string
  text: string
  priority: "high" | "medium" | "low"
  dueDate: string | null
  completed: boolean
}

export interface Bill {
  id: string
  name: string
  amount: number
  currency: "KWD" | "USD"
  dueDay: number
  category: string
  inKwd: number
  status: "overdue" | "due-soon" | "normal" | "paid"
}

export interface MarketRadar {
  ticker: string
  name: string
  price: number
  fv: number | null
  margin: number
}

export interface Milestone {
  projectName: string
  title: string
  dueDate: string
  done: boolean
}

export interface WarrantyItem {
  id: string
  itemName: string
  provider: string
  purchaseDate: string
  expirationDate: string
  daysRemaining: number
  totalDays: number
}

export interface AlertItem {
  id: string
  severity: "critical" | "warning"
  title: string
  message: string
}

export type DeskId = "overview" | "financial" | "operating" | "vault"

// ─── Constants ───────────────────────────────────────────────────

export const HABITS = [
  { id: "fajr", label: "Fajr" },
  { id: "dhuhr", label: "Dhuhr" },
  { id: "asr", label: "Asr" },
  { id: "maghrib", label: "Maghrib" },
  { id: "isha", label: "Isha" },
  { id: "morning-routine", label: "Morning" },
  { id: "exercise", label: "Exercise" },
  { id: "read", label: "Read" },
  { id: "no-junk-food", label: "No Junk" },
  { id: "cold-shower", label: "Cold Shower" },
]

export const PROJECT_NAMES = ["Hadeya", "Reluxx", "Osoul", "XYZ Agency", "Personal Brand"]

// ─── Helpers ─────────────────────────────────────────────────────

export function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

export const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function formatCurrency(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}
