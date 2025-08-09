import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/server/db"
import { verifySessionToken } from "@/lib/server/auth"

export async function GET() {
  const raw = cookies().get(SESSION_COOKIE)?.value
  const payload = verifySessionToken(raw ?? null)
  return NextResponse.json({
    cookiePresent: Boolean(raw),
    tokenValid: Boolean(payload),
    payload,
  })
}
