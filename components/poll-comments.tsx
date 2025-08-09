"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Heart, MessageSquare } from "lucide-react"
import AuthDialog from "@/components/auth-dialog"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

type SortMode = "newest" | "most-liked"

type ClientComment = {
  id: string
  pollId: string
  userId: string
  author: string
  text: string
  createdAt: string
  likes: number
  likedByMe?: boolean
}

const PAGE_SIZE = 5

export default function PollComments({ pollId }: { pollId: string }) {
  const user = useSelector((s: RootState) => s.auth.user)
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState<SortMode>("newest")
  const [comments, setComments] = useState<ClientComment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [likingId, setLikingId] = useState<string | null>(null)

  const canLoadMore = comments.length < total

  const initials = useMemo(() => (user ? user.email.slice(0, 2).toUpperCase() : "NA"), [user])

  const fetchPage = useCallback(
    async (offset: number) => {
      setLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const res = await fetch(
          `/api/polls/comments?pollId=${encodeURIComponent(pollId)}&offset=${offset}&limit=${PAGE_SIZE}&sort=${sort}`,
          { cache: "no-store", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
        )
        const data = await res.json()
        if (res.ok) {
          if (offset === 0) setComments(data.comments || [])
          else setComments((prev) => [...prev, ...(data.comments || [])])
          setTotal(Number(data.total || 0))
        }
      } finally {
        setLoading(false)
      }
    },
    [pollId, sort],
  )

  // Load hasVoted when panel opens or user changes
  useEffect(() => {
    if (!open) return
    async function checkVoted() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const res = await fetch(`/api/polls/has-voted?pollId=${encodeURIComponent(pollId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        setHasVoted(Boolean(data.hasVoted))
      } catch {
        setHasVoted(false)
      }
    }
    checkVoted()
    fetchPage(0)
  }, [open, pollId, fetchPage, user])

  async function onPost() {
    setError(null)
    if (!user) return
    const body = text.trim()
    if (body.length === 0) return
    setPosting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch("/api/polls/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ pollId, text: body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Failed to post comment")
        return
      }
      // Prepend on newest, otherwise refetch for most-liked
      if (sort === "newest") {
        setComments((prev) => [data.comment as ClientComment, ...prev])
        setTotal((t) => t + 1)
      } else {
        fetchPage(0)
      }
      setText("")
    } finally {
      setPosting(false)
    }
  }

  async function onToggleLike(c: ClientComment) {
    if (!user) return
    setLikingId(c.id)
    // Optimistic update
    setComments((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, likedByMe: !x.likedByMe, likes: x.likes + (x.likedByMe ? -1 : 1) } : x)),
    )
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch("/api/polls/comments/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ commentId: c.id, toggle: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Revert by refetching first page to keep it simple
        fetchPage(0)
      } else {
        // Align with server counts if different
        setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, likedByMe: data.liked, likes: data.likes } : x)))
      }
    } finally {
      setLikingId(null)
    }
  }

  return (
    <div className="mt-4">
      <button
        className="w-full text-left text-sm px-3 py-2 rounded-md border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition flex items-center justify-between"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>{`💬 View Comments (${total})`}</span>
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0b1220]/60 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{`Comments (${total})`}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Composer */}
          {user ? (
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {!hasVoted && (
                  <div className="rounded-md border border-amber-300/40 bg-amber-100/40 dark:bg-amber-900/20 px-3 py-2 text-xs">
                    You must vote in this poll before commenting.
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-red-300/40 bg-red-100/40 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add your comment…"
                  className="min-h-[70px] resize-y"
                  disabled={!hasVoted}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={onPost} disabled={posting || text.trim().length === 0 || !hasVoted}>
                    {posting ? "Posting…" : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-black/5 dark:border-white/10 p-3">
              <p className="text-sm mb-2">Sign in to join the discussion.</p>
              <AuthDialog />
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {comments.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
            )}
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3"
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{c.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-medium">{c.author}</span>{" "}
                      <span className="text-muted-foreground">· {timeAgo(c.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!user || likingId === c.id}
                    onClick={() => onToggleLike(c)}
                    aria-pressed={Boolean(c.likedByMe)}
                    aria-label={c.likedByMe ? "Unlike comment" : "Like comment"}
                    title={user ? (c.likedByMe ? "Unlike" : "Like") : "Sign in to like"}
                    className={cn(
                      "h-7 px-2 transition-colors",
                      c.likedByMe ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Heart
                      className="h-4 w-4 mr-1"
                      strokeWidth={2}
                      fill={c.likedByMe ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    <span className="text-xs tabular-nums">{c.likes}</span>
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center">
            {canLoadMore ? (
              <Button variant="outline" size="sm" onClick={() => fetchPage(comments.length)} disabled={loading}>
                {loading ? "Loading…" : "Load more comments"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Showing all comments</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
