export function timeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)

  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`

  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`

  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`

  const wk = Math.floor(day / 7)
  if (wk < 5) return `${wk}w ago`

  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`

  const yr = Math.floor(day / 365)
  return `${yr}y ago`
}

export function humanPollTiming(now: Date, start: Date, end: Date): string {
  if (now < start) {
    return `Starts in ${humanDuration(start.getTime() - now.getTime())}`
  }
  if (now >= start && now <= end) {
    return `Ends in ${humanDuration(end.getTime() - now.getTime())}`
  }
  return `Closed ${humanDuration(now.getTime() - end.getTime())} ago`
}

function humanDuration(ms: number): string {
  const sec = Math.ceil(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.ceil(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.ceil(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.ceil(hr / 24)
  if (day < 30) return `${day}d`
  const mo = Math.ceil(day / 30)
  if (mo < 12) return `${mo}mo`
  const yr = Math.ceil(day / 365)
  return `${yr}y`
}
