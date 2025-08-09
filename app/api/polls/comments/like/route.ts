import { NextResponse } from "next/server"
import { getCommentById, hasUserLikedComment, likeComment, unlikeComment } from "@/lib/server/db"
import { getCurrentUserFromRequest } from "@/lib/server/auth"
import { getClientIp } from "@/lib/server/ip"
import { checkRateLimit } from "@/lib/server/rate-limit"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const commentId = body?.commentId as string | undefined
    const action = body?.action as "like" | "unlike" | undefined
    const toggle = body?.toggle as boolean | undefined

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 })
    }
    const user = getCurrentUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const comment = getCommentById(commentId)
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })

    // Basic per-IP rate limit for like toggles
    const ip = getClientIp(req)
    const rl = checkRateLimit(`like:${ip}`, 20, 60_000)
    if (!rl.ok) {
      const res = NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 })
      res.headers.set("Retry-After", Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString())
      return res
    }

    let liked: boolean
    let likes: number

    if (toggle || !action) {
      // Toggle based on current state
      if (hasUserLikedComment(commentId, user.id)) {
        likes = unlikeComment(commentId, user.id)
        liked = false
      } else {
        likes = likeComment(commentId, user.id)
        liked = true
      }
    } else if (action === "like") {
      likes = likeComment(commentId, user.id)
      liked = true
    } else {
      likes = unlikeComment(commentId, user.id)
      liked = false
    }

    return NextResponse.json({ commentId, liked, likes })
  } catch {
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  }
}
