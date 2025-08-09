"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useChartColors } from "@/lib/use-chart-colors"
import type { Poll } from "@/lib/features/polls/pollsSlice"

type ApiPoll = Poll

type Snapshot = {
  polls: ApiPoll[]
  lastUpdated: string
}

export default function PollsOverviewAnalytics() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const c = useChartColors()

  const fetchNow = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/polls", { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to fetch polls")
      const snapshot: Snapshot = {
        polls: (json?.polls ?? []) as ApiPoll[],
        lastUpdated: new Date().toISOString(),
      }
      setData(snapshot)
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNow()
  }, [fetchNow])

  // Derive metrics without mutating any source objects
  const { totalPolls, totalVotes, avgVotes, chartData } = useMemo(() => {
    const polls = data?.polls ?? []
    const totals = polls.map((p) => ({
      id: p.id,
      name: p.question,
      votes: p.options.reduce((s, o) => s + o.votes, 0),
    }))

    // Non-mutating "short label" for tick formatter
    const withShort = totals.map((t) => ({
      ...t,
      shortLabel: t.name.length > 18 ? t.name.slice(0, 15) + "…" : t.name,
    }))

    const totalVotesAll = totals.reduce((s, t) => s + t.votes, 0)
    return {
      totalPolls: polls.length,
      totalVotes: totalVotesAll,
      avgVotes: polls.length > 0 ? Math.round(totalVotesAll / polls.length) : 0,
      chartData: withShort,
    }
  }, [data])

  return (
    <Card className="bg-white dark:bg-[#0b1220]/60 border border-black/5 dark:border-white/10">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle>Polls Overview Analytics (Current Snapshot)</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNow} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-300/40 bg-red-100/40 dark:bg-red-900/20 p-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat title="Total Polls" value={totalPolls} />
          <Stat title="Total Votes" value={totalVotes} />
          <Stat title="Avg Votes / Poll" value={avgVotes} />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Votes Per Poll</h3>
          <div className="h-[260px] w-full rounded-md" role="img" aria-label="Bar chart showing total votes per poll">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: c.axis, fontSize: 12 }}
                  axisLine={{ stroke: c.axis }}
                  tickLine={{ stroke: c.axis }}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: c.axis, fontSize: 12 }}
                  axisLine={{ stroke: c.axis }}
                  tickLine={{ stroke: c.axis }}
                />
                <Tooltip
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{ background: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipText }}
                  labelStyle={{ color: c.tooltipText }}
                  itemStyle={{ color: c.tooltipText }}
                  // Pure formatter: does not modify inputs
                  formatter={(value: number) => [`${Number(value ?? 0)}`, "Total"]}
                  labelFormatter={(label: string, payload) => {
                    // Show full question in tooltip label using the first payload point
                    const first = payload?.[0]?.payload as { name?: string }
                    return first?.name ?? label
                  }}
                />
                <Bar dataKey="votes" fill={c.bar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Updated {data ? new Date(data.lastUpdated).toLocaleTimeString() : "…"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  )
}
