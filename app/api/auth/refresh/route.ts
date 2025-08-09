import { NextResponse } from "next/server"
import { getCurrentUserFromRequest, mintSessionToken, setSessionCookie } from "@/lib/server/auth"

export async function GET(req: Request) {
  const user = getCurrentUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "No active session" }, { status: 401 })
  const token = mintSessionToken(user.id)
  // Refresh the cookie too (optional, aligns cookie+bearer lifetimes)
  setSessionCookie(token)
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
  })
}
