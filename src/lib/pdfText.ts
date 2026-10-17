import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { groupIntoRows, type TextItem } from './rows'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Reads the text layer of a PDF in the browser and returns its rows of cells, all pages in order. */
export async function extractRows(data: ArrayBuffer): Promise<string[][]> {
  const doc = await pdfjs.getDocument({ data }).promise
  const rows: string[][] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent()
    const items: TextItem[] = content.items
      .filter((it) => 'str' in it)
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
    rows.push(...groupIntoRows(items))
  }
  return rows
}
