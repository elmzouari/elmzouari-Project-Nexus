import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/server/db"
import { verifySessionToken } from "@/lib/server/auth"

export async function GET(req: Request) {
  const rawCookie = cookies().get(SESSION_COOKIE)?.value
  const cookiePayload = verifySessionToken(rawCookie ?? null)

  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization") || req.headers.get("x-authorization")
  const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null
  const headerPayload = verifySessionToken(bearer ?? null)

  return NextResponse.json({
    cookiePresent: Boolean(rawCookie),
    cookieTokenValid: Boolean(cookiePayload),
    cookiePayload,
    authHeaderPresent: Boolean(authHeader),
    headerTokenValid: Boolean(headerPayload),
    headerPayload,
  })
}
