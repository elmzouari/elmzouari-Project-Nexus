import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { safeJson } from "@/lib/safe-json"

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  startDate: string
  endDate: string
  type: "single-choice" | "multi-select"
  categories?: string[]
  createdAt: string
}

interface PollsState {
  polls: Poll[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: PollsState = { polls: [], status: "idle", error: null }

function getAuthHeader() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("auth_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const fetchPolls = createAsyncThunk("polls/fetchPolls", async () => {
  const res = await fetch("/api/polls", {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error((data as any)?.error || `Failed to fetch polls (HTTP ${res.status})`)
  const polls = (data as any)?.polls
  if (!Array.isArray(polls)) throw new Error("Failed to fetch polls: invalid response shape")
  return polls as Poll[]
})

export const voteOnPoll = createAsyncThunk(
  "polls/voteOnPoll",
  async ({ pollId, optionIds, revote }: { pollId: string; optionIds: string[]; revote?: boolean }) => {
    const res = await fetch("/api/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader(), "Cache-Control": "no-cache" },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({ pollId, optionIds, revote }),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error((data as any)?.error || `Failed to vote on poll (HTTP ${res.status})`)
    return (data as any).updatedPoll as Poll
  },
)

export const createNewPoll = createAsyncThunk(
  "polls/createNewPoll",
  async (newPoll: {
    question: string
    options: string[]
    startDate: string
    endDate: string
    type: "single-choice" | "multi-select"
    categories?: string[]
  }) => {
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader(), "Cache-Control": "no-cache" },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify(newPoll),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error((data as any)?.error || `Failed to create poll (HTTP ${res.status})`)
    return (data as any).newPoll as Poll
  },
)

const pollsSlice = createSlice({
  name: "polls",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolls.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchPolls.fulfilled, (state, action: PayloadAction<Poll[]>) => {
        state.status = "succeeded"
        state.polls = action.payload
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Something went wrong"
      })
      .addCase(voteOnPoll.fulfilled, (state, action: PayloadAction<Poll>) => {
        const idx = state.polls.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.polls[idx] = action.payload
      })
      .addCase(voteOnPoll.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to cast vote"
      })
      .addCase(createNewPoll.fulfilled, (state, action: PayloadAction<Poll>) => {
        state.polls.push(action.payload)
      })
      .addCase(createNewPoll.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create poll"
      })
  },
})

export default pollsSlice.reducer
