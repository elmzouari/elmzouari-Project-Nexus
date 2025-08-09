"use client"

import type React from "react"
import AuthInit from "@/components/auth-init" // Inserted import

import { Inter } from "next/font/google"
import "./globals.css"
import { Provider } from "react-redux"
import { makeStore } from "@/lib/store"
import { useRef } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes" // Import ThemeProvider

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const storeRef = useRef<ReturnType<typeof makeStore>>()
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider store={storeRef.current}>
          <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthInit /> {/* Inserted AuthInit component */}
            {children}
          </NextThemesProvider>
        </Provider>
      </body>
    </html>
  )
}
