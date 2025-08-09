"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { setAuthFromRefresh } from "@/lib/features/auth/authSlice"

export default function AuthInit() {
  const dispatch = useDispatch<AppDispatch>()
  const tokenInStore = useSelector((s: RootState) => s.auth.token)

  useEffect(() => {
    const lsToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (lsToken || tokenInStore) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/refresh", { credentials: "include", cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.token && data?.user) {
          dispatch(setAuthFromRefresh({ token: data.token, user: data.user }))
        }
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [dispatch, tokenInStore])

  return null
}

