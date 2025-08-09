import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { addPoll, getPolls, type Poll } from "@/lib/server/db"
import { getCurrentUserFromRequest } from "@/lib/server/auth"

// Toggle this to true to require admin for creating polls.
const ADMIN_ONLY_CREATION = false

export async function GET() {
  const polls = getPolls()
  return NextResponse.json({ polls })
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUserFromRequest(req)

    // Only enforce admin if the flag is enabled.
    if (ADMIN_ONLY_CREATION) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: admins only" }, { status: 403 })
      }
    }

    const { question, options: optionTexts, startDate, endDate, type, categories } = await req.json()

    if (
      !question ||
      !optionTexts ||
      !Array.isArray(optionTexts) ||
      optionTexts.length < 2 ||
      !startDate ||
      !endDate ||
      !type ||
      !["single-choice", "multi-select"].includes(type)
    ) {
      return NextResponse.json(
        { error: "Invalid poll data. Question, options, start/end dates, and a valid type are required." },
        { status: 400 },
      )
    }

    const newPoll: Poll = {
      id: uuidv4(),
      question,
      options: optionTexts.map((text: string) => ({ id: uuidv4(), text, votes: 0 })),
      startDate,
      endDate,
      type,
      categories: Array.isArray(categories) ? categories.filter((c) => typeof c === "string" && c.trim()) : [],
      createdAt: new Date().toISOString(),
    }

    addPoll(newPoll)
    return NextResponse.json({ newPoll }, { status: 201 })
  } catch (error) {
    console.error("Error creating poll:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
