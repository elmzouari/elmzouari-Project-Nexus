
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { safeJson } from "@/lib/safe-json"

export type Role = "admin" | "user"
export interface AuthUser {
  id: string
  email: string
  role: Role
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
}

function getStoredToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}
function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem("auth_token", token)
  else localStorage.removeItem("auth_token")
}

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ email, password }: { email: string; password: string }) => {
    const res = await fetch("/api/auth/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok || !data) {
      throw new Error((data as any)?.error || `Registration failed (HTTP ${res.status})`)
    }
    return { user: (data as any).user as AuthUser, token: (data as any).token as string }
  },
)

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok || !data) throw new Error((data as any)?.error || `Login failed (HTTP ${res.status})`)
    return { user: (data as any).user as AuthUser, token: (data as any).token as string }
  },
)

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  const res = await fetch("/api/auth/logout", { method: "POST" })
  if (!res.ok) throw new Error("Logout failed")
  return true
})

export const fetchCurrentUser = createAsyncThunk("auth/me", async () => {
  const token = getStoredToken()
  if (!token) return null as AuthUser | null
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    cache: "no-store",
  })
  const data = await safeJson(res)
  return (data as any)?.user ?? null
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateToken: (state) => {
      state.token = getStoredToken()
    },
    setAuthFromRefresh: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.status = "succeeded"
      state.error = null
      setStoredToken(action.payload.token)
    },
    resetAuth: (state) => {
      state.user = null
      state.token = null
      state.status = "idle"
      state.error = null
      if (typeof window !== "undefined") localStorage.removeItem("auth_token")
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
        state.status = "succeeded"
        state.user = action.payload.user
        state.token = action.payload.token
        setStoredToken(action.payload.token)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Registration failed"
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
        state.status = "succeeded"
        state.user = action.payload.user
        state.token = action.payload.token
        setStoredToken(action.payload.token)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Login failed"
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.status = "idle"
        state.error = null
        setStoredToken(null)
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        state.user = action.payload
      })
  },
})

export const { hydrateToken, setAuthFromRefresh, resetAuth } = authSlice.actions
export default authSlice.reducer
