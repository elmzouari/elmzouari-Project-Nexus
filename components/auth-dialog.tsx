"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { loginUser, registerUser } from "@/lib/features/auth/authSlice"

export default function AuthDialog() {
  const dispatch = useDispatch<AppDispatch>()
  const auth = useSelector((s: RootState) => s.auth)
  const [open, setOpen] = useState(false)

  // Close on successful auth
  useEffect(() => {
    if (auth.user && open) setOpen(false)
  }, [auth.user, open])

  // Forms
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await dispatch(loginUser({ email: loginEmail, password: loginPassword }))
  }

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    await dispatch(registerUser({ email: regEmail, password: regPassword }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign in / Sign up</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>Sign in to vote or create polls. Admins can create polls.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <form className="space-y-3" onSubmit={onLogin}>
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              {auth.error && <p className="text-sm text-red-600">{auth.error}</p>}
              <Button type="submit" className="w-full" disabled={auth.status === "loading"}>
                {auth.status === "loading" ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Demo admin account: admin@example.com / admin123
              </p>
            </form>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <form className="space-y-3" onSubmit={onRegister}>
              <div className="grid gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              </div>
              {auth.error && <p className="text-sm text-red-600">{auth.error}</p>}
              <Button type="submit" className="w-full" disabled={auth.status === "loading"}>
                {auth.status === "loading" ? "Creating..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
