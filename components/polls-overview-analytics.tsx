"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import type { Poll } from "@/lib/features/polls/pollsSlice"
import { useChartColors } from "@/lib/use-chart-colors"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PollsOverviewAnalyticsProps {
  polls: Poll[]
}

function shorten(label: string, max = 20) {
  if (!label) return ""
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

export default function PollsOverviewAnalytics({ polls }: PollsOverviewAnalyticsProps) {
  const totalPolls = polls.length
  const totalVotesAcrossAllPolls = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.options.reduce((s, o) => s + o.votes, 0), 0),
    [polls],
  )
  const avgVotesPerPoll = totalPolls > 0 ? Math.round(totalVotesAcrossAllPolls / totalPolls) : 0

  const chartData = useMemo(
    () =>
      polls.map((poll) => ({
        id: poll.id,
        name: poll.question,
        short: shorten(poll.question),
        votes: poll.options.reduce((sum, option) => sum + option.votes, 0),
      })),
    [polls],
  )

  // Trend indicator (compare with last snapshot)
  const [delta, setDelta] = useState(0)
  const prev = useRef<number | null>(null)
  useEffect(() => {
    const prevStored = typeof window !== "undefined" ? Number(localStorage.getItem("kpi_total_votes") || "0") : 0
    prev.current = prevStored
    setDelta(totalVotesAcrossAllPolls - prevStored)
    if (typeof window !== "undefined") localStorage.setItem("kpi_total_votes", String(totalVotesAcrossAllPolls))
  }, [totalVotesAcrossAllPolls])

  const mostPopular = useMemo(() => chartData.slice().sort((a, b) => b.votes - a.votes)[0], [chartData])
  const mostRecent = useMemo(
    () => polls.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0],
    [polls],
  )

  const c = useChartColors()

  // Color palette per bar
  const palette = [
    "#7c6cf5",
    "#f59e0b",
    "#10b981",
    "#22d3ee",
    "#ef4444",
    "#e879f9",
    "#f472b6",
    "#34d399",
    "#60a5fa",
    "#f97316",
  ]

  // Detailed view (optional pie chart for a single poll)
  const [detailPollId, setDetailPollId] = useState<string | "none">("none")
  const detailPoll = useMemo(
    () => (detailPollId === "none" ? null : polls.find((p) => p.id === detailPollId)),
    [detailPollId, polls],
  )
  const totalVotesForDetail = detailPoll?.options.reduce((s, o) => s + o.votes, 0) ?? 0

  return (
    <Card className="w-full max-w-6xl rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0b1220]/60 shadow-lg">
      <CardHeader>
        <CardTitle className="tracking-tight">Polls Overview Analytics (Current Snapshot)</CardTitle>
        <p className="text-sm text-muted-foreground">
          This dashboard reads from a single source of truth (/api/polls) and auto-refreshes wherever enabled.
          Percentages are relative to total votes across all polls.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <p className="text-5xl font-bold text-primary">{totalPolls}</p>
            <p className="text-lg text-muted-foreground">Total Polls</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <p className="text-5xl font-bold text-primary">{totalVotesAcrossAllPolls}</p>
              {delta !== 0 ? (
                delta > 0 ? (
                  <span className="text-emerald-500 inline-flex items-center text-sm font-medium">
                    <ArrowUpRight className="h-5 w-5" />+{delta}
                  </span>
                ) : (
                  <span className="text-red-500 inline-flex items-center text-sm font-medium">
                    <ArrowDownRight className="h-5 w-5" />
                    {delta}
                  </span>
                )
              ) : null}
            </div>
            <p className="text-lg text-muted-foreground">Total Votes</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <p className="text-5xl font-bold text-primary">{avgVotesPerPoll}</p>
            <p className="text-lg text-muted-foreground">Avg Votes / Poll</p>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
            <p className="text-sm text-muted-foreground">Most Popular</p>
            <p className="font-medium mt-1">{mostPopular?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{mostPopular ? `${mostPopular.votes} votes` : ""}</p>
          </div>
          <div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
            <p className="text-sm text-muted-foreground">Recently Created</p>
            <p className="font-medium mt-1">{mostRecent?.question ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {mostRecent ? new Date(mostRecent.createdAt).toLocaleString() : ""}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[320px] w-full" role="img" aria-label="Bar chart of total votes per poll">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Votes Per Poll</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Detail:</span>
              <Select value={detailPollId} onValueChange={(v) => setDetailPollId(v as any)}>
                <SelectTrigger className="h-8 w-[220px]">
                  <SelectValue placeholder="Select a poll for pie chart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {polls.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {shorten(p.question, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="short"
                angle={-30}
                textAnchor="end"
                height={70}
                tick={{ fill: c.axis, fontSize: 12 }}
                axisLine={{ stroke: c.axis }}
                tickLine={{ stroke: c.axis }}
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
                formatter={(value: number, _name: string, payload: any) => {
                  const votes = value as number
                  const pct = totalVotesAcrossAllPolls > 0 ? (votes / totalVotesAcrossAllPolls) * 100 : 0
                  // show full poll name on hover
                  payload?.payload && (payload.payload.short = payload.payload.name)
                  return [`${votes} votes (${pct.toFixed(1)}%)`, "Total"]
                }}
              />
              <Bar dataKey="votes" name="Total Votes">
                {chartData.map((_e, i) => (
                  <Cell key={`cell-${i}`} fill={palette[i % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Optional Pie for per-poll proportions */}
        {detailPoll && (
          <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold mb-2">Option Breakdown: {detailPoll.question}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{ background: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipText }}
                  labelStyle={{ color: c.tooltipText }}
                  itemStyle={{ color: c.tooltipText }}
                  formatter={(value: number) => {
                    const pct = totalVotesForDetail > 0 ? ((value as number) / totalVotesForDetail) * 100 : 0
                    return [`${value} (${pct.toFixed(1)}%)`, "Votes"]
                  }}
                />
                <Legend />
                <Pie data={detailPoll.options} dataKey="votes" nameKey="text" outerRadius={100} innerRadius={40}>
                  {detailPoll.options.map((_o, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
