import type { ComponentType, SVGProps } from "react"
import { Code2, Globe, Heart, PawPrint, BarChart3, Layers, MessageSquare } from "lucide-react"

type IconType = ComponentType<SVGProps<SVGSVGElement>>

export function pickIcon(categories?: string[]): IconType {
  const set = new Set((categories ?? []).map((c) => c.toLowerCase()))
  if (set.has("programming") || set.has("coding") || set.has("dev")) return Code2
  if (set.has("web")) return Globe
  if (set.has("lifestyle")) return Heart
  if (set.has("pets") || set.has("animals")) return PawPrint
  if (set.has("data") || set.has("analytics")) return BarChart3
  if (set.has("design") || set.has("ui")) return Layers
  return MessageSquare
}
