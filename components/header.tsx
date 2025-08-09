"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import UserMenu from "@/components/user-menu"
import Link from "next/link"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Interactive Polling Platform</h1>
        <nav className="hidden sm:flex items-center gap-4 mr-2">
          <Link href="/" className="text-sm hover:underline">
            Home
          </Link>
          <Link href="/dashboard" className="text-sm hover:underline">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
