export function getDaysAgo(submittedAt: string): number {
  const ms = Date.now() - new Date(submittedAt).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}
