import { NextResponse } from "next/server"
import {
  getPollById,
  hasUserVoted,
  getUserVoteOptions,
  setUserVoteOptions,
  incrementVotes,
  decrementVotes,
} from "@/lib/server/db"
import { getCurrentUserFromRequest } from "@/lib/server/auth"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { getClientIp } from "@/lib/server/ip"

export async function POST(req: Request) {
  try {
    const user = getCurrentUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Unauthorized: please sign in to vote." }, { status: 401 })

    const ip = getClientIp(req)
    const rl = checkRateLimit(`vote:${ip}`, 20, 60_000)
    if (!rl.ok) {
      const res = NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 })
      res.headers.set("Retry-After", Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString())
      return res
    }

    const { pollId, optionIds, revote }: { pollId: string; optionIds: string[]; revote?: boolean } = await req.json()
    const poll = await getPollById(pollId)
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    const now = new Date()
    const start = new Date(poll.startDate)
    const end = new Date(poll.endDate)
    if (now < start) return NextResponse.json({ error: "Voting has not started for this poll." }, { status: 403 })
    if (now > end) return NextResponse.json({ error: "Voting has ended for this poll." }, { status: 403 })

    if (!Array.isArray(optionIds) || optionIds.length === 0)
      return NextResponse.json({ error: "No options selected for voting." }, { status: 400 })

    if (poll.type === "single-choice" && optionIds.length !== 1) {
      return NextResponse.json({ error: "Select exactly one option for single-choice polls." }, { status: 400 })
    }

    // Handle prior vote
    const already = await hasUserVoted(pollId, user.id)
    if (already && !revote) {
      return NextResponse.json({ error: "You have already voted on this poll." }, { status: 409 })
    }

    if (already && revote) {
      const prev = (await getUserVoteOptions(pollId, user.id)) ?? []
      // Remove previous counts, apply new
      decrementVotes(poll, prev)
      incrementVotes(poll, optionIds)
      setUserVoteOptions(pollId, user.id, optionIds)
      return NextResponse.json({ updatedPoll: poll })
    }

    // First-time vote
    incrementVotes(poll, optionIds)
    setUserVoteOptions(pollId, user.id, optionIds)

    return NextResponse.json({ updatedPoll: poll })
  } catch (error) {
    console.error("Error voting on poll:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
