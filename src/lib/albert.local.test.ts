// Runs the parser on real PDFs in the git-ignored receipts/ folder. Skipped when the folder is empty.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { parseAlbertReceipt } from './albert'
import { groupIntoRows } from './rows'

const dir = 'receipts'
const pdfs = existsSync(dir) ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')) : []

describe.skipIf(pdfs.length === 0)('real receipts in receipts/', () => {
  it.each(pdfs)('%s parses without warnings', async (file) => {
    const doc = await getDocument({ data: new Uint8Array(readFileSync(`${dir}/${file}`)) }).promise
    const rows: string[][] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent()
      rows.push(...groupIntoRows(content.items
        .filter((it) => 'str' in it)
        .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))))
    }
    const receipt = parseAlbertReceipt(rows)
    expect(receipt.warnings).toEqual([])
    expect(receipt.items.length).toBeGreaterThan(0)
  })
})
