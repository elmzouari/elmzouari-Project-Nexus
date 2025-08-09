"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchPolls } from "@/lib/features/polls/pollsSlice"
import PollsOverviewAnalytics from "@/components/polls-overview-analytics"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>()
  const polls = useSelector((s: RootState) => s.polls.polls)
  const status = useSelector((s: RootState) => s.polls.status)
  const error = useSelector((s: RootState) => s.polls.error)

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const refreshIntervalMs = 15000

  // Load saved preference (default OFF)
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem("auto_refresh_enabled")
    if (saved != null) setAutoRefresh(saved === "true")
  }, [])

  const doFetch = useCallback(async () => {
    await dispatch(fetchPolls())
    setLastUpdated(new Date())
  }, [dispatch])

  // Initial fetch on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      await doFetch()
      if (!mounted) return
    })()
    return () => {
      mounted = false
    }
  }, [doFetch])

  // Optional auto-refresh only when enabled
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(doFetch, refreshIntervalMs)
    return () => clearInterval(id)
  }, [autoRefresh, doFetch])

  const kpi = useMemo(() => {
    const totalVotes = polls.reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0)
    return { count: polls.length, votes: totalVotes }
  }, [polls])

  function handleToggle(val: boolean) {
    setAutoRefresh(val)
    try {
      localStorage.setItem("auto_refresh_enabled", String(val))
    } catch {}
    // Kick off an immediate fetch when turning ON so data is fresh
    if (val) void doFetch()
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0b1220] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Live metrics from a single source: {"/api/polls"} — auto-refresh is off by default.
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1" aria-live="polite">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Controls: manual refresh + auto-refresh toggle */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={doFetch}
              aria-label="Refresh dashboard data now"
              className="gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh now
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={handleToggle}
                aria-label="Toggle auto-refresh every 15 seconds"
              />
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh {autoRefresh ? "(every 15s)" : "(off)"}
              </Label>
            </div>
          </div>
        </div>

        {status === "failed" && (
          <p className="text-red-500" role="alert">
            Error: {error}
          </p>
        )}

        {/* Analytics card (KPIs + chart) */}
        <PollsOverviewAnalytics polls={polls} />

        {/* Mobile summary */}
        <div className="md:hidden text-sm text-muted-foreground">
          <div>Polls: {kpi.count}</div>
          <div>Total votes: {kpi.votes}</div>
        </div>
      </div>
    </main>
  )
}
