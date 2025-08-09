import { cookies } from "next/headers"
import HmacSHA256 from "crypto-js/hmac-sha256"
import SHA256 from "crypto-js/sha256"
import { v4 as uuidv4 } from "uuid"
import encUtf8 from "crypto-js/enc-utf8"
import encBase64 from "crypto-js/enc-base64"
import { findUserByEmail, findUserById, hashPassword, SESSION_COOKIE, cookieOptions, type User } from "@/lib/server/db"

// DEMO ONLY: use an env var in production
const SECRET = "demo-secret-key-change-me"

type SessionPayload = { sub: string; iat: number }

function b64urlEncode(str: string) {
  const b64 = encBase64.stringify(encUtf8.parse(str))
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function b64urlDecode(str: string) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64
  return encUtf8.stringify(encBase64.parse(padded))
}
function sign(input: string) {
  const sig = HmacSHA256(input, SECRET)
  const b64 = encBase64.stringify(sig)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function mintSessionToken(userId: string) {
  const payload: SessionPayload = { sub: userId, iat: Math.floor(Date.now() / 1000) }
  const payloadB64 = b64urlEncode(JSON.stringify(payload))
  const signature = sign(payloadB64)
  return `${payloadB64}.${signature}`
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [payloadB64, signature] = parts
  const expected = sign(payloadB64)
  if (expected !== signature) return null
  try {
    const json = b64urlDecode(payloadB64)
    const payload = JSON.parse(json) as SessionPayload
    return payload
  } catch {
    return null
  }
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, { ...cookieOptions })
}
export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 })
}

export function getCurrentUserFromRequest(req: Request): User | null {
  // Prefer Authorization header
  const auth = req.headers.get("authorization") || req.headers.get("Authorization")
  let token: string | null = null
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    token = auth.slice(7)
  } else {
    // Fallback to cookie
    token = cookies().get(SESSION_COOKIE)?.value ?? null
  }
  const payload = verifySessionToken(token)
  if (!payload) return null
  const user = findUserById(payload.sub)
  return user ?? null
}

// Convenience: authenticate email/password and return user or null
export function authenticate(email: string, password: string): User | null {
  const user = findUserByEmail(email)
  if (!user) return null
  const candidateHash = hashPassword(password, user.salt)
  if (candidateHash !== user.passwordHash) return null
  return user
}

// Demo helper: hash a new password (unused externally here)
export function hashNewPassword(password: string) {
  const salt = uuidv4()
  const passwordHash = SHA256(password + salt).toString()
  return { salt, passwordHash }
}
