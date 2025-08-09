export async function safeJson<T = any>(res: Response): Promise<T | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}
