"use client"

import type { Poll } from "@/lib/features/polls/pollsSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"
import { useChartColors } from "@/lib/use-chart-colors"

// Format a short x-axis label without mutating original objects
function shortLabel(s: string, max = 18) {
  if (!s) return ""
  return s.length <= max ? s : s.slice(0, max - 1) + "…"
}

export default function PollsOverviewAnalytics({ polls }: { polls: Poll[] }) {
  const c = useChartColors()

  const kpis = useMemo(() => {
    const totalPolls = polls.length
    let totalVotes = 0
    let topPoll: Poll | null = null
    let topPollVotes = -1
    let recentPoll: Poll | null = null

    for (const p of polls) {
      const votes = p.options.reduce((s, o) => s + o.votes, 0)
      totalVotes += votes
      if (votes > topPollVotes) {
        topPollVotes = votes
        topPoll = p
      }
      if (!recentPoll || +new Date(p.createdAt) > +new Date(recentPoll.createdAt)) {
        recentPoll = p
      }
    }

    const avgVotes = totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0
    return { totalPolls, totalVotes, avgVotes, topPoll, recentPoll }
  }, [polls])

  // Build chart data immutably
  const chartData = useMemo(
    () =>
      polls.map((p) => ({
        id: p.id,
        label: p.question,
        short: shortLabel(p.question),
        votes: p.options.reduce((s, o) => s + o.votes, 0),
      })),
    [polls],
  )

  // Accessible tooltip (no mutation)
  function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div
        className="rounded-md border px-2 py-1 text-xs"
        style={{ background: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipText }}
      >
        <div className="font-medium">{label}</div>
        <div>{`Total: ${item.value}`}</div>
      </div>
    )
  }

  return (
    <Card className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0b1220]/60">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Polls Overview Analytics (Current Snapshot)</CardTitle>
        <p className="text-sm text-muted-foreground">
          This dashboard reads from a single source of truth and uses manual refresh. Percentages in poll cards are
          relative to total votes within each poll.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-black/5 dark:border-white/10 p-3 text-center">
            <div className="text-3xl font-semibold">{kpis.totalPolls}</div>
            <div className="text-xs text-muted-foreground">Total Polls</div>
          </div>
          <div className="rounded-md border border-black/5 dark:border-white/10 p-3 text-center">
            <div className="text-3xl font-semibold">{kpis.totalVotes}</div>
            <div className="text-xs text-muted-foreground">Total Votes</div>
          </div>
          <div className="rounded-md border border-black/5 dark:border-white/10 p-3 text-center">
            <div className="text-3xl font-semibold">{kpis.avgVotes}</div>
            <div className="text-xs text-muted-foreground">Avg Votes / Poll</div>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-black/5 dark:border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">Most Popular</div>
            {kpis.topPoll ? (
              <>
                <div className="font-medium">{kpis.topPoll.question}</div>
                <div className="text-xs text-muted-foreground">
                  {kpis.topPoll.options.reduce((s, o) => s + o.votes, 0)} votes
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
          <div className="rounded-md border border-black/5 dark:border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">Recently Created</div>
            {kpis.recentPoll ? (
              <>
                <div className="font-medium">{kpis.recentPoll.question}</div>
                <div className="text-xs text-muted-foreground">{new Date(kpis.recentPoll.createdAt).toLocaleString()}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>

        {/* Votes per poll */}
        <div className="space-y-2">
          <div className="text-base font-semibold">Votes Per Poll</div>
          <div className="h-[260px] w-full rounded-md">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 30 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="short"
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
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="votes" name="Total Votes" fill={c.bar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {chartData.map((d) => (
              <Badge key={d.id} variant="outline" className="text-xs">
                {d.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
