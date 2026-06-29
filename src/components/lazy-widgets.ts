"use client"

import { lazy } from "react"

// ─── Lazy-loaded widgets (largest files — loaded on-demand per desk tab) ───

export const PortfolioTracker = lazy(() => import("@/components/PortfolioTracker"))
export const TradingJournal = lazy(() => import("@/components/TradingJournal"))
export const ProjectsTracker = lazy(() => import("@/components/ProjectsTracker"))
export const LegalCases = lazy(() => import("@/components/LegalCases"))
export const OsoulArchitect = lazy(() => import("@/components/OsoulArchitect"))
export const ShiftTracker = lazy(() => import("@/components/ShiftTracker"))
export const TodoList = lazy(() => import("@/components/TodoList"))
export const BillsTracker = lazy(() => import("@/components/BillsTracker"))
export const BudgetSnapshot = lazy(() => import("@/components/BudgetSnapshot"))
export const HabitTracker = lazy(() => import("@/components/HabitTracker"))
