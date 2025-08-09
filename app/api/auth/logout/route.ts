import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/server/auth"

export async function POST() {
  try {
    clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
