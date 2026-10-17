export interface TextItem {
  str: string
  x: number
  y: number
}

/** Items whose baselines are this close (in PDF units) belong to the same row. */
const ROW_TOLERANCE = 2

/**
 * Groups positioned text pieces from a PDF page into rows of cells,
 * top to bottom and left to right. Whitespace-only pieces are dropped.
 */
export function groupIntoRows(items: TextItem[]): string[][] {
  const sorted = items
    .filter((it) => it.str.trim() !== '')
    .sort((a, b) => b.y - a.y || a.x - b.x)

  const rows: TextItem[][] = []
  for (const item of sorted) {
    const row = rows[rows.length - 1]
    if (row && Math.abs(row[0].y - item.y) <= ROW_TOLERANCE) row.push(item)
    else rows.push([item])
  }

  return rows.map((row) => row.sort((a, b) => a.x - b.x).map((it) => it.str.trim()))
}
