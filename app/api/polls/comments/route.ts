import { NextResponse } from "next/server"
import { addComment, getCommentsPaginated, getPollById, hasUserVoted, hasUserLikedComment } from "@/lib/server/db"
import { getCurrentUserFromRequest } from "@/lib/server/auth"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { getClientIp } from "@/lib/server/ip"

// Simple, server-side profanity filter (you can swap with a real service later)
const BANNED = ["damn", "hell", "shit", "fuck", "bitch", "asshole"].map((w) => w.toLowerCase())

function containsProfanity(input: string): boolean {
  const lower = input.toLowerCase()
  return BANNED.some((w) => lower.includes(w))
}

const MAX_LEN = 500
const MIN_LEN = 3

export async function GET(req: Request) {
  const url = new URL(req.url)
  const pollId = url.searchParams.get("pollId")
  const sort = (url.searchParams.get("sort") || "newest") as "newest" | "most-liked"
  const offset = Number(url.searchParams.get("offset") || "0")
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "5")))
  if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 })
  const poll = getPollById(pollId)
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

  const { total, items } = getCommentsPaginated(pollId, sort, offset, limit)
  const user = getCurrentUserFromRequest(req)

  // Attach likedByMe for this viewer
  const withLikeInfo = items.map((c) => ({
    ...c,
    likedByMe: user ? hasUserLikedComment(c.id, user.id) : false,
  }))

  return NextResponse.json({ total, comments: withLikeInfo })
}

export async function POST(req: Request) {
  try {
    const { pollId, text } = await req.json()

    if (!pollId || typeof text !== "string") {
      return NextResponse.json({ error: "pollId and text are required" }, { status: 400 })
    }
    const clean = text.trim()
    if (clean.length < MIN_LEN) {
      return NextResponse.json({ error: `Comment is too short (min ${MIN_LEN} chars)` }, { status: 400 })
    }
    if (clean.length > MAX_LEN) {
      return NextResponse.json({ error: `Comment is too long (max ${MAX_LEN} chars)` }, { status: 400 })
    }
    if (containsProfanity(clean)) {
      return NextResponse.json({ error: "Please keep the conversation civil (profanity filtered)" }, { status: 400 })
    }

    const poll = getPollById(pollId)
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    const user = getCurrentUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only voters can comment
    const voted = hasUserVoted(pollId, user.id)
    if (!voted) {
      return NextResponse.json({ error: "You must vote before commenting." }, { status: 403 })
    }

    const ip = getClientIp(req)
    const rl = checkRateLimit(`comment:${ip}`, 5, 60_000)
    if (!rl.ok) {
      const res = NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 })
      res.headers.set("Retry-After", Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString())
      return res
    }

    const author = user.email.split("@")[0]
    const comment = addComment(pollId, user.id, author, clean)
    return NextResponse.json({ comment: { ...comment, likedByMe: false } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
  }
}
