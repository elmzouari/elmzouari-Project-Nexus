"use client"

import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchPolls, voteOnPoll, createNewPoll } from "@/lib/features/polls/pollsSlice"
import PollCard from "@/components/poll-card"
import PollForm from "@/components/poll-form"
import type { Poll } from "@/lib/features/polls/pollsSlice"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import PollsOverviewAnalytics from "@/components/polls-overview-analytics"
import { Switch } from "@/components/ui/switch"

export default function Home() {
  const dispatch = useDispatch<AppDispatch>()
  const polls = useSelector((s: RootState) => s.polls.polls)
  const pollStatus = useSelector((s: RootState) => s.polls.status)
  const error = useSelector((s: RootState) => s.polls.error)
  const authUser = useSelector((s: RootState) => s.auth.user)

  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming" | "closed">("active")
  const [sortBy, setSortBy] = useState<"newest" | "most-votes" | "ending-soon">("newest")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (pollStatus === "idle") dispatch(fetchPolls())
  }, [pollStatus, dispatch])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => dispatch(fetchPolls()), 15000)
    return () => clearInterval(id)
  }, [autoRefresh, dispatch])

  const handleCreatePoll = (
    question: string,
    options: string[],
    startDate: string,
    endDate: string,
    type: Poll["type"],
    categories?: string[],
  ) => {
    return dispatch(createNewPoll({ question, options, startDate, endDate, type, categories }))
      .unwrap()
      .then((newPoll) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("poll:created", { detail: newPoll }))
        }
        return newPoll
      })
  }

  useEffect(() => {
    function onPollCreated(e: Event) {
      const ce = e as CustomEvent<Poll>
      const created = ce.detail
      if (!created) return

      // Set the filter to match the new poll's status so it's visible
      const now = new Date()
      const s = new Date(created.startDate)
      const en = new Date(created.endDate)
      const status: "active" | "upcoming" | "closed" = now < s ? "upcoming" : now > en ? "closed" : "active"
      setFilterStatus(status)

      // Wait a tick for the list to render, then scroll and highlight
      setTimeout(() => {
        const el = document.getElementById(`poll-${created.id}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          el.classList.add("ring-4", "ring-amber-400", "transition-shadow")
          setTimeout(() => el.classList.remove("ring-4", "ring-amber-400"), 2000)
        }
      }, 50)
    }

    window.addEventListener("poll:created", onPollCreated as EventListener)
    return () => window.removeEventListener("poll:created", onPollCreated as EventListener)
  }, [])

  const handleVote = (pollId: string, optionIds: string[], revote?: boolean) => {
    return dispatch(voteOnPoll({ pollId, optionIds, revote }))
  }

  const pollsWithCalculatedStatus = useMemo(() => {
    const now = new Date()
    return polls.map((poll) => {
      const pollStartDate = new Date(poll.startDate)
      const pollEndDate = new Date(poll.endDate)
      const isUpcoming = now < pollStartDate
      const isActive = now >= pollStartDate && now <= pollEndDate
      const isClosed = now > pollEndDate
      const status: "upcoming" | "active" | "closed" = isUpcoming ? "upcoming" : isClosed ? "closed" : "active"
      return { ...poll, isUpcoming, isActive, isClosed, status }
    })
  }, [polls])

  const filteredPolls = useMemo(() => {
    const list =
      filterStatus === "all"
        ? pollsWithCalculatedStatus
        : pollsWithCalculatedStatus.filter((p) => p.status === filterStatus)
    switch (sortBy) {
      case "most-votes":
        return list
          .slice()
          .sort((a, b) => b.options.reduce((s, o) => s + o.votes, 0) - a.options.reduce((s, o) => s + o.votes, 0))
      case "ending-soon":
        return list.slice().sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate))
      case "newest":
      default:
        return list.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    }
  }, [pollsWithCalculatedStatus, filterStatus, sortBy])

  let content
  if (pollStatus === "loading") {
    content = <p className="text-center text-lg">Loading polls...</p>
  } else if (pollStatus === "succeeded") {
    if (filteredPolls.length === 0) {
      content = <p className="text-center text-lg text-gray-600">No {filterStatus} polls found.</p>
    } else {
      content = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onVote={handleVote} />
          ))}
        </div>
      )
    }
  } else if (pollStatus === "failed") {
    content = <p className="text-center text-lg text-red-500">Error: {error}</p>
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-[#0b1220]">
      <Header />
      <div className="mb-12 w-full max-w-6xl">
        {!authUser && (
          <Alert className="mb-6">
            <AlertTitle>Sign in required to vote</AlertTitle>
            <AlertDescription>Sign in to participate in polls. Admins can create polls.</AlertDescription>
          </Alert>
        )}
        <section className="mb-12">
          <PollsOverviewAnalytics polls={polls} />
        </section>

        <PollForm onCreatePoll={handleCreatePoll} />

        <section className="w-full max-w-6xl mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">Polls</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Auto-refresh</span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">View:</span>
                <Select value={filterStatus} onValueChange={(v: typeof filterStatus) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter polls" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sort:</span>
                <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="most-votes">Most votes</SelectItem>
                    <SelectItem value="ending-soon">Ending soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {content}
        </section>
      </div>
    </main>
  )
}
