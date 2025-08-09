"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { setAuthFromRefresh } from "@/lib/features/auth/authSlice"

// Hydrates auth from a server session cookie by minting a fresh bearer token
// if localStorage lacks one (e.g., after reload).
export default function AuthInit() {
  const dispatch = useDispatch<AppDispatch>()
  const tokenInStore = useSelector((s: RootState) => s.auth.token)

  useEffect(() => {
    // If we already have a token in localStorage or store, skip
    const lsToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (lsToken || tokenInStore) return

    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/refresh", { credentials: "include", cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (aborted) return
        if (data?.token && data?.user) {
          dispatch(setAuthFromRefresh({ token: data.token, user: data.user }))
        }
      } catch {
        // ignore
      }
    })()

    return () => {
      aborted = true
    }
  }, [dispatch, tokenInStore])

  return null
}
