import { parseCzk } from './money'

/** All money values are in haléře (1 Kč = 100) so sums stay exact. */
export interface ReceiptItem {
  /** Name exactly as printed, e.g. "OLMA SELS.MLÉ.3,9%1L". */
  name: string
  quantity: number
  /** "kg" for weighed items, undefined for pieces. */
  unit?: string
  unitPrice: number
  total: number
  /** VAT code letter (A = 12 %, B = 21 % on current receipts). */
  vatCode?: string
}

export interface ParsedReceipt {
  chain: 'Albert'
  storeName?: string
  storeAddress?: string
  /** Local time without zone, e.g. "2026-08-11T13:08". */
  purchasedAt?: string
  receiptNumber?: string
  /** Long number at the bottom of the receipt; unique per purchase, useful to skip duplicates. */
  receiptId?: string
  items: ReceiptItem[]
  total: number
  /** "Díky akcím jste ušetřili …" – total saved by promotions. */
  savings?: number
  /** Things the parser didn't understand. Non-empty means the result needs a human look. */
  warnings: string[]
}

const QTY_LINE = /^(\d+(?:[.,]\d+)?)\s*(kg|ks)?\s*x\s*(-?\d+(?:[.,]\d{1,2})?)\s*Kč$/i
const VAT_CODE = /^[A-Z]$/
const IGNORED_ITEM_ROWS = /^Získané (kredity|body)/

/** Parses the rows of an Albert e-receipt PDF (see groupIntoRows). */
export function parseAlbertReceipt(rows: string[][]): ParsedReceipt {
  const receipt: ParsedReceipt = { chain: 'Albert', items: [], total: 0, warnings: [] }

  const itemsStart = rows.findIndex((r) => r[0] === 'Položka' && r[1] === 'Cena')
  const itemsEnd = rows.findIndex((r) => r[0] === 'Celkem')
  if (itemsStart === -1 || itemsEnd === -1 || itemsEnd < itemsStart) {
    receipt.warnings.push('Could not find the item list – is this an Albert e-receipt?')
    return receipt
  }

  let pending: { name: string; vatCode?: string } | null = null
  for (const row of rows.slice(itemsStart + 1, itemsEnd)) {
    const qty = row[0].match(QTY_LINE)
    if (qty && pending) {
      const total = parseCzk(row[row.length - 1])
      if (total === null) receipt.warnings.push(`Missing line total for "${pending.name}"`)
      receipt.items.push({
        name: pending.name,
        quantity: parseFloat(qty[1].replace(',', '.')),
        unit: qty[2]?.toLowerCase() === 'kg' ? 'kg' : undefined,
        unitPrice: parseCzk(qty[3])!,
        total: total ?? 0,
        vatCode: pending.vatCode,
      })
      pending = null
    } else if (!qty && !IGNORED_ITEM_ROWS.test(row[0])) {
      if (pending) receipt.warnings.push(`No price line after "${pending.name}"`)
      const last = row[row.length - 1]
      pending = row.length > 1 && VAT_CODE.test(last)
        ? { name: row.slice(0, -1).join(' '), vatCode: last }
        : { name: row.join(' ') }
    }
  }
  if (pending) receipt.warnings.push(`No price line after "${pending.name}"`)

  receipt.total = parseCzk(rows[itemsEnd][rows[itemsEnd].length - 1]) ?? 0

  for (const [i, row] of rows.entries()) {
    const line = row.join(' ')

    const savings = line.match(/ušetřili\s+(\d+(?:[.,]\d{1,2})?)\s*Kč/)
    if (savings) receipt.savings = parseCzk(savings[1]) ?? undefined

    const stamp = line.match(/(\d{2})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}) Účtenka číslo (\d+)/)
    if (stamp) {
      const [, dd, mm, yy, hh, min, num] = stamp
      receipt.purchasedAt = `20${yy}-${mm}-${dd}T${hh}:${min}`
      receipt.receiptNumber = num
    }

    // The store sits in the left column under "PRODEJNA"; the right column ("KLIENT") is the customer's phone.
    if (row[0] === 'PRODEJNA') {
      receipt.storeName = rows[i + 1]?.[0]
      receipt.storeAddress = rows[i + 2]?.[0]
    }

    if (row.length === 1 && /^\d{30,}$/.test(row[0])) receipt.receiptId = row[0]
  }

  if (!receipt.purchasedAt) receipt.warnings.push('Could not find the purchase date')
  const sum = receipt.items.reduce((acc, it) => acc + it.total, 0)
  if (sum !== receipt.total) {
    receipt.warnings.push(`Items add up to ${sum / 100} Kč but the receipt total is ${receipt.total / 100} Kč`)
  }

  return receipt
}
