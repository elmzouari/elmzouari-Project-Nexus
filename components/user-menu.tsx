"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchCurrentUser, logoutUser } from "@/lib/features/auth/authSlice"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AuthDialog from "./auth-dialog"

export default function UserMenu() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    dispatch(fetchCurrentUser())
  }, [dispatch])

  if (!user) {
    return <AuthDialog />
  }

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <div className="px-2 py-1">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">Role: {user.role}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => dispatch(logoutUser())}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
