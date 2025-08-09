import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

interface Poll {
  id: string
  question: string
  options: { id: string; text: string }[]
  startDate: string
  endDate: string
  type: string
  categories: string[]
}

interface PollState {
  polls: Poll[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: PollState = {
  polls: [],
  status: "idle",
  error: null,
}

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const fetchPolls = createAsyncThunk("polls/fetchPolls", async () => {
  const response = await fetch("/api/polls")
  const data = await response.json()
  return data
})

export const voteOnPoll = createAsyncThunk(
  "polls/voteOnPoll",
  async ({ pollId, optionIds, revote }: { pollId: string; optionIds: string[]; revote: boolean }) => {
    const res = await fetch("/api/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader(), "Cache-Control": "no-cache" },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({ pollId, optionIds, revote }),
    })
    const data = await res.json()
    return data
  },
)

export const createNewPoll = createAsyncThunk("polls/createNewPoll", async (newPoll: Poll) => {
  const res = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader(), "Cache-Control": "no-cache" },
    cache: "no-store",
    credentials: "include",
    body: JSON.stringify(newPoll),
  })
  const data = await res.json()
  return data
})

const pollsSlice = createSlice({
  name: "polls",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolls.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchPolls.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.polls = action.payload
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || null
      })
      .addCase(voteOnPoll.pending, (state) => {
        state.status = "loading"
      })
      .addCase(voteOnPoll.fulfilled, (state, action) => {
        state.status = "succeeded"
        // Handle poll vote update here
      })
      .addCase(voteOnPoll.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || null
      })
      .addCase(createNewPoll.pending, (state) => {
        state.status = "loading"
      })
      .addCase(createNewPoll.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.polls.push(action.payload)
      })
      .addCase(createNewPoll.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || null
      })
  },
})

export default pollsSlice.reducer
