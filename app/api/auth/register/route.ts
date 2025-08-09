import { NextResponse } from "next/server"
import { createUser } from "@/lib/server/db"
import { mintSessionToken, setSessionCookie } from "@/lib/server/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const user = createUser(email, password, "user")
    const token = mintSessionToken(user.id)
    setSessionCookie(token)
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 400 })
  }
}
