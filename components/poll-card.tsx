"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Poll } from "@/lib/features/polls/pollsSlice"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import PollShareDialog from "./poll-share-dialog"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import AuthDialog from "@/components/auth-dialog"
import { useToast } from "@/hooks/use-toast"
import { useChartColors } from "@/lib/use-chart-colors"
import { Badge } from "@/components/ui/badge"
import { pickIcon } from "@/components/category-icon"
import { humanPollTiming } from "@/lib/time"
import PollComments from "@/components/poll-comments"
import { safeJson } from "@/lib/safe-json"

interface PollCardProps {
  poll: Poll
  onVote: (pollId: string, optionIds: string[], revote?: boolean) => Promise<any>
}

export default function PollCard({ poll, onVote }: PollCardProps) {
  const { toast } = useToast()
  const [selectedSingleOption, setSelectedSingleOption] = useState<string | null>(null)
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [prevOptionIds, setPrevOptionIds] = useState<string[]>([])
  const [changing, setChanging] = useState(false)
  const [participants, setParticipants] = useState<number>(0)
  const [ariaAnnounce, setAriaAnnounce] = useState("")

  const user = useSelector((s: RootState) => s.auth.user)

  const now = useMemo(() => new Date(), [])
  const pollStartDate = useMemo(() => new Date(poll.startDate), [poll.startDate])
  const pollEndDate = useMemo(() => new Date(poll.endDate), [poll.endDate])

  const isUpcoming = now < pollStartDate
  const isActive = now >= pollStartDate && now <= pollEndDate

  const statusText = humanPollTiming(now, pollStartDate, pollEndDate)

  const totalVotes = useMemo(() => poll.options.reduce((s, o) => s + o.votes, 0), [poll.options])
  const chartData = useMemo(
    () =>
      poll.options.map((o) => ({
        name: o.text,
        votes: o.votes,
        percentage: totalVotes > 0 ? (o.votes / totalVotes) * 100 : 0,
      })),
    [poll.options, totalVotes],
  )

  const c = useChartColors()

  // Fetch participants count and has-voted info
  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const [votedRes, participantsRes] = await Promise.all([
          fetch(`/api/polls/has-voted?pollId=${encodeURIComponent(poll.id)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          }).then((r) => safeJson(r)),
          fetch(`/api/polls/participants?pollId=${encodeURIComponent(poll.id)}`, {
            credentials: "include",
          }).then((r) => safeJson(r)),
        ])
        setHasVoted(Boolean((votedRes as any)?.hasVoted))
        setPrevOptionIds(Array.isArray((votedRes as any)?.optionIds) ? ((votedRes as any).optionIds as string[]) : [])
        setParticipants(Number((participantsRes as any)?.participants ?? 0))
      } catch {
        // no-op
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, poll.id])

  const handleMultiOptionChange = (optionId: string, checked: boolean) => {
    setSelectedMultiOptions((prev) => (checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)))
  }

  const beginChange = () => {
    setChanging(true)
    if (poll.type === "single-choice") setSelectedSingleOption(prevOptionIds[0] || null)
    else setSelectedMultiOptions(prevOptionIds)
  }

  const handleVote = async (revote?: boolean) => {
    if (!isActive) return
    let optionsToVote: string[] = []
    if (poll.type === "single-choice" && selectedSingleOption) optionsToVote = [selectedSingleOption]
    if (poll.type === "multi-select" && selectedMultiOptions.length > 0) optionsToVote = selectedMultiOptions
    if (optionsToVote.length === 0) return

    try {
      await onVote(poll.id, optionsToVote, revote)
      setHasVoted(true)
      setPrevOptionIds(optionsToVote)
      setChanging(false)
      // optimistic participant increment for first-time vote
      if (!revote && participants >= 0) setParticipants((p) => p + 1)
      toast({ title: "Vote recorded!", description: "Thanks for participating." })
      setAriaAnnounce("Vote recorded. Results updated.")
    } catch (err: any) {
      toast({
        title: "Vote failed",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const Icon = pickIcon(poll.categories)

  return (
    <Card
      id={`poll-${poll.id}`}
      className="w-full max-w-md rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0b1220]/60 shadow-lg transition hover:shadow-xl hover:translate-y-[-1px]"
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="leading-tight">{poll.question}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          {poll.categories?.map((c) => (
            <Badge key={c} variant="secondary" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>
        <p className={`text-sm ${isUpcoming ? "text-blue-600" : isActive ? "text-green-600" : "text-red-600"}`}>
          {statusText}
        </p>
        <p className="text-xs text-muted-foreground">
          Type: {poll.type === "single-choice" ? "Single Choice" : "Multi-Select"}
        </p>
      </CardHeader>

      <CardContent>
        {!hasVoted && isActive ? (
          poll.type === "single-choice" ? (
            <>
              <p id={"vote-help-" + poll.id} className="sr-only">
                Use arrow keys to move and Space or Enter to select. Then activate the Vote button.
              </p>
              <RadioGroup
                aria-describedby={"vote-help-" + poll.id}
                onValueChange={setSelectedSingleOption}
                value={selectedSingleOption || ""}
              >
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`}>{option.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          ) : (
            <>
              <p id={"vote-help-" + poll.id} className="sr-only">
                Use arrow keys to move and Space or Enter to select. Then activate the Vote button.
              </p>
              <div className="space-y-2" aria-describedby={"vote-help-" + poll.id}>
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedMultiOptions.includes(option.id)}
                      onCheckedChange={(checked) => handleMultiOptionChange(option.id, checked as boolean)}
                    />
                    <Label htmlFor={`option-${option.id}`}>{option.text}</Label>
                  </div>
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <div
              className="h-[200px] w-full"
              role="img"
              aria-label={"Results chart showing percentage share for options in " + poll.question}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fill: c.axis, fontSize: 12 }}
                    axisLine={{ stroke: c.axis }}
                    tickLine={{ stroke: c.axis }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fill: c.axis, fontSize: 12 }}
                    axisLine={{ stroke: c.axis }}
                    tickLine={{ stroke: c.axis }}
                  />
                  <Tooltip
                    wrapperStyle={{ outline: "none" }}
                    contentStyle={{ background: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipText }}
                    labelStyle={{ color: c.tooltipText }}
                    itemStyle={{ color: c.tooltipText }}
                    formatter={(value: number) => [`${(value as number).toFixed(1)}%`, "Share"]}
                  />
                  <Bar dataKey="percentage" fill={c.bar} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Participants: {participants} • Total Votes: {totalVotes}
              </p>
              {hasVoted && (
                <p className="text-sm text-green-600 text-center mt-2">
                  You have already voted{isActive ? ". You can change your vote." : "."}
                </p>
              )}
            </div>
            <span className="sr-only" aria-live="polite">
              {ariaAnnounce}
            </span>

            {/* Comments - directly below chart */}
            <PollComments pollId={poll.id} />
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between items-center gap-2">
        {!user && isActive && <AuthDialog />}
        {user && isActive && !hasVoted && (
          <Button
            onClick={() => handleVote(false)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={
              (poll.type === "single-choice" && !selectedSingleOption) ||
              (poll.type === "multi-select" && selectedMultiOptions.length === 0)
            }
          >
            Vote
          </Button>
        )}
        {user && isActive && hasVoted && !changing && (
          <Button variant="secondary" onClick={beginChange}>
            Change vote
          </Button>
        )}
        {user && isActive && hasVoted && changing && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleVote(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                (poll.type === "single-choice" && !selectedSingleOption) ||
                (poll.type === "multi-select" && selectedMultiOptions.length === 0)
              }
            >
              Save new vote
            </Button>
            <Button variant="ghost" onClick={() => setChanging(false)}>
              Cancel
            </Button>
          </div>
        )}
        {!isActive && <Button disabled>Voting {isUpcoming ? "Not Started" : "Closed"}</Button>}
        <PollShareDialog poll={poll} />
      </CardFooter>
    </Card>
  )
}
