# Účtenky – receipt price tracker

Web app (PC + phone) for scanning grocery receipts and tracking item prices over time, so you can
compare stores ("this is on sale here, but at Albert I paid less at normal price").

## Stack
- Vite + React 19 + TypeScript. Planned: PWA, Supabase (free tier) for DB/auth, Vercel or Cloudflare Pages for hosting.
- PDF text extraction with `pdfjs-dist` in the browser – Albert e-receipts have a real text layer, no OCR needed.
- Tests: Vitest (`npm test`).

## Commands
- `npm run dev` – dev server on http://localhost:5173
- `npm test` – unit tests
- `npm run build` / `npm run lint`

## Code layout
- `src/lib/pdfText.ts` – browser-only: PDF → rows of text cells (uses the pdfjs worker).
- `src/lib/rows.ts` – pure: groups positioned text pieces into rows.
- `src/lib/albert.ts` – pure: rows → `ParsedReceipt`. One parser per store chain.
- `src/lib/money.ts` – money is stored as integer **haléře** (1 Kč = 100), never floats.
- `src/lib/__fixtures__/` – anonymized receipt rows used by tests.

## Conventions
- Parsers are pure functions on `string[][]` rows so they're testable without PDFs.
- Parsers never throw on unknown formats; they add to `warnings`. A clean receipt must have zero warnings
  and its items must add up to the total.
- **Real receipts contain card digits and phone numbers.** Keep them in `receipts/` (git-ignored); it's picked
  up by `albert.local.test.ts`. Anything committed as a fixture must be scrubbed first.

## Status / next up
- [x] Albert PDF parser + tests, upload page that shows parsed items
- [ ] Collect more Albert receipts, especially weighed items (kg) and per-item discounts – formats not yet seen
- [ ] Supabase: stores, receipts, receipt_items, products, product_aliases (raw name per store → product)
- [ ] Product matching UI (link "OLMA SELS.MLÉ.3,9%1L" at Albert with the same milk at other stores)
- [ ] PWA manifest, deploy
- [ ] Paper receipts via OCR (Tesseract.js, Czech) – later
