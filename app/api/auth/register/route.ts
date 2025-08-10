import { NextResponse } from "next/server"
import { authenticate, mintSessionToken, setSessionCookie } from "@/lib/server/auth"
import { createUser, findUserByEmail } from "@/lib/server/db"

// Demo "upsert" auth:
// - If the user exists and the password is correct, returns a session (login).
// - If the user does not exist, creates the user then returns a session (register).
// - If the user exists but password is wrong, returns 409.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const existing = findUserByEmail(email)
    if (existing) {
      const user = authenticate(email, password)
      if (!user) {
        return NextResponse.json({ error: "Account exists, but the password is incorrect." }, { status: 409 })
      }
      const token = mintSessionToken(user.id)
      setSessionCookie(token)
      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
        mode: "login",
      })
    }

    // Create new user
    const user = createUser(email, password, "user")
    const token = mintSessionToken(user.id)
    setSessionCookie(token)
    return NextResponse.json(
      {
        token,
        user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
        mode: "register",
      },
      { status: 201 },
    )
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upsert failed" }, { status: 500 })
  }
}

// Handle potential preflight/OPTIONS gracefully (useful if a proxy issues it)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

