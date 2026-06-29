"use client"

import { Component, ReactNode } from "react"
import { ShieldAlert, RotateCcw } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[LCC ErrorBoundary]", error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-primary p-8">
          <div className="glass-card-static max-w-md p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              حدث خطأ غير متوقع
            </h2>
            <p className="mb-6 text-sm text-text-secondary">
              {this.state.error?.message ?? "Something went wrong"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="btn-primary mx-auto active:scale-[0.97] touch-action-manipulation"
            >
              <RotateCcw className="h-4 w-4" />
              إعادة تحميل
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
