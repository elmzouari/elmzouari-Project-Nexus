import { NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server/auth"

export async function GET(req: Request) {
  const user = getCurrentUserFromRequest(req)
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt } })
}
