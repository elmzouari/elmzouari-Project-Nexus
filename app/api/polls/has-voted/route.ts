import { NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server/auth"
import { getPollById, getUserVoteOptions, hasUserVoted } from "@/lib/server/db"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const pollId = url.searchParams.get("pollId")
  if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 })

  const poll = getPollById(pollId)
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

  const user = getCurrentUserFromRequest(req)
  if (!user) {
    // Allow anonymous queries so UI can show state; just report false.
    return NextResponse.json({ hasVoted: false, optionIds: [] })
  }

  const voted = hasUserVoted(pollId, user.id)
  const optionIds = getUserVoteOptions(pollId, user.id) ?? []
  return NextResponse.json({ hasVoted: voted, optionIds })
}
