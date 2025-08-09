/**
 * Extract a client IP from common proxy headers.
 * In serverless and local dev, this is best-effort.
 */
export function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const xr = req.headers.get("x-real-ip")?.trim()
  // Fall back to a stable placeholder in environments where IP is unavailable.
  return xf || xr || "0.0.0.0"
}
