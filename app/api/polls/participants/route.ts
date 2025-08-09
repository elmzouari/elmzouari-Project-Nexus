import { NextResponse } from "next/server"
import { getParticipantCount, getPollById } from "@/lib/server/db"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const pollId = url.searchParams.get("pollId")
  if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 })

  const poll = getPollById(pollId)
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

  const participants = getParticipantCount(pollId)
  return NextResponse.json({ participants })
}
