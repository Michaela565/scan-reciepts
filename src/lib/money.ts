/** Parses "35.90 Kč", "-12,50 Kč" or "35.90" into haléře (integer). Returns null if it isn't money. */
export function parseCzk(text: string): number | null {
  const m = text.trim().match(/^(-?\d+(?:[.,]\d{1,2})?)\s*(?:Kč)?$/)
  if (!m) return null
  return Math.round(parseFloat(m[1].replace(',', '.')) * 100)
}

export function formatCzk(halere: number): string {
  return `${(halere / 100).toFixed(2)} Kč`
}
