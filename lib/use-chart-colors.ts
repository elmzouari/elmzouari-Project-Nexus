"use client"

import { useEffect, useState } from "react"

type ChartColors = {
  axis: string
  grid: string
  label: string
  bar: string
  tooltipBg: string
  tooltipText: string
  tooltipBorder: string
}

// Theme-aware colors with strong contrast in dark mode.
// Falls back to sensible defaults if CSS variables are not present.
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>({
    // Defaults tuned for dark mode readability
    axis: "#f8fafc", // near-white ticks/axes
    grid: "rgba(255,255,255,0.28)", // dashed white grid at ~28% opacity
    label: "#f8fafc",
    bar: "#a9a3ff", // soft lavender
    tooltipBg: "#0b1220", // deep navy
    tooltipText: "#ffffff",
    tooltipBorder: "rgba(255,255,255,0.12)",
  })

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains("dark")

    // Helper to read CSS variables if available
    const get = (name: string, fallback: string) => {
      const v = getComputedStyle(root).getPropertyValue(name).trim()
      return v || fallback
    }

    if (isDark) {
      // Prefer your design tokens, fallback to our dark defaults
      const foreground = get("--foreground", "#f8fafc")
      const border = get("--border", "rgba(255,255,255,0.28)")
      const card = get("--card", "#0b1220")
      setColors({
        axis: foreground,
        grid: border.includes("#") ? "rgba(255,255,255,0.28)" : border,
        label: foreground,
        bar: "#a9a3ff",
        tooltipBg: card || "#0b1220",
        tooltipText: foreground,
        tooltipBorder: "rgba(255,255,255,0.12)",
      })
    } else {
      // Light mode: darker ticks/grid, same bar hue
      const foreground = get("--foreground", "#0f172a")
      const border = get("--border", "rgba(0,0,0,0.15)")
      const card = get("--card", "#ffffff")
      setColors({
        axis: "#4b5563",
        grid: border.includes("#") ? "rgba(0,0,0,0.15)" : border,
        label: foreground,
        bar: "#7c6cf5",
        tooltipBg: card || "#ffffff",
        tooltipText: "#0f172a",
        tooltipBorder: "rgba(0,0,0,0.15)",
      })
    }
  }, [])

  return colors
}
