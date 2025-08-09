import { NextRequest, NextResponse } from "next/server"

// Returns a participants count for a pollId without throwing 404s.
// If backing data isn't available (demo mode), it returns 0 instead of failing.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")

  if (!pollId) {
    return NextResponse.json({ error: "Missing pollId" }, { status: 400 })
  }

  try {
    // Try to read from a shared in-memory store if present:
    const g = globalThis as unknown as {
      __POLL_DB__?: {
        polls?: Array<{ id: string; options?: Array<{ votes?: number }> }>
        votesByPoll?: Record<string, Array<{ userId: string }>>
        participantsByPoll?: Record<string, number>
      }
    }

    const db = g.__POLL_DB__

    // Priority 1: explicit participants count if maintained by the API
    const participantsFromMap = db?.participantsByPoll?.[pollId]
    if (typeof participantsFromMap === "number") {
      return NextResponse.json({ participants: participantsFromMap })
    }

    // Priority 2: unique voters if we have a vote log
    const votes = db?.votesByPoll?.[pollId]
    if (Array.isArray(votes)) {
      const unique = new Set(votes.map((v) => v.userId))
      return NextResponse.json({ participants: unique.size })
    }

    // Fallback: approximate using total option votes on the poll if present
    const poll = db?.polls?.find((p) => p.id === pollId)
    if (poll?.options?.length) {
      const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes ?? 0), 0)
      return NextResponse.json({ participants: totalVotes })
    }

    // Safe default for demo mode
    return NextResponse.json({ participants: 0 })
  } catch {
    // Never 404 here, keep the UI stable
    return NextResponse.json({ participants: 0 })
  }
}
