import { NextResponse } from "next/server"
import { authenticate, mintSessionToken, setSessionCookie } from "@/lib/server/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const user = authenticate(email, password)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const token = mintSessionToken(user.id)
    // Optional cookie; the client will use Authorization header
    setSessionCookie(token)

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    })
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
