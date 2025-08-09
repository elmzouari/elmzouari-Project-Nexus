export async function safeJson<T = any>(res: Response): Promise<T | null> {
  try {
    // Some responses may be empty or not JSON; catch and return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
