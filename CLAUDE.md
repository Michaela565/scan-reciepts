# Účtenky – receipt price tracker

Web app (PC + phone) for scanning grocery receipts and tracking item prices over time, so you can
compare stores ("this is on sale here, but at Albert I paid less at normal price").

## How we work
This is a portfolio project for internship applications, so the owner must understand and be able to
defend every line in an interview. Claude is a pair programmer and reviewer, not the author.
- **Small commits.** One logical change per commit with a clear message ("Handle weighed items in Albert
  parser"). Don't bundle unrelated changes. Commit only when asked, after the owner has seen the diff.
- **Owner decides, Claude advises.** For design decisions (data model, architecture, libraries) ask or let
  the owner sketch first, then review and suggest; don't hand over a finished design.
- **Explain, don't just write.** When writing code, explain the why behind non-obvious choices. When the
  owner wants to write something themselves, describe what's needed and review their code instead of
  rewriting it.
- **Keep changes reviewable.** Prefer small steps the owner can read in one sitting over large drops.

## Stack
- Vite + React 19 + TypeScript. Planned: PWA, Vercel or Cloudflare Pages for hosting.
- Supabase (free tier): Postgres + email/password auth, used directly from the browser via `@supabase/supabase-js`.
- PDF text extraction with `pdfjs-dist` in the browser – Albert e-receipts have a real text layer, no OCR needed.
- Tests: Vitest (`npm test`).

## Setup on a new machine
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Project URL and **publishable** key from
   Supabase → Settings → API Keys. Never the secret / service_role key. `.env.local` is git-ignored.
3. Optional: put real receipt PDFs into `receipts/` (git-ignored, not in the repo – copy them by hand).

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
- `src/lib/supabase.ts` – the single Supabase client.
- `src/auth/useSession.tsx` – hook: `undefined` = still checking, `null` = signed out, `Session` = signed in.
- `src/auth/LoginForm.tsx` – email + password sign-in. `App.tsx` shows it when signed out.
- `supabase/migrations/` – the database schema, applied in filename order.

## Database
Written by the owner (see git history); Claude reviewed.
- Tables: `store` (shared: chain + branch), and per user: `category` (name, keywords), `receipt`,
  `store_item` (what a chain calls an item → category, size, unit), `receipt_item` (one purchase line →
  store_item, quantity, unit_price). Line totals aren't stored; they're `quantity * unit_price`.
- `store_item.category_id` / `size` / `unit` are `null` until the user fills them in ("not categorized yet").
- Security: RLS on every table, explicit grants to `authenticated` only (auto-expose is off in the project).
  Per-user tables check `user_id = auth.uid()`; `receipt_item` checks ownership through `receipt` and
  `store_item`. `store` is readable/insertable by any signed-in user, not updatable or deletable.
- `save_receipt(p_receipt jsonb)` – saves a whole `ParsedReceipt` in one transaction: find-or-create store,
  insert receipt (raises `Receipt already imported` on duplicate `long_receipt_id`), find-or-create
  store_items, insert receipt_items. Called with `supabase.rpc('save_receipt', { p_receipt })`.
  The app converts `purchasedAt` to an ISO timestamp (browser local time) before sending.
- Accounts: the owner's account and a test account (for checking RLS), created in the dashboard; public
  sign-ups are off.

## Database conventions
- Migrations are applied by pasting them into the Supabase SQL Editor (no Supabase CLI yet).
- **Never edit a migration that has already been run** – add a new numbered file instead.
- Use `on conflict do nothing` + `select … into` for find-or-create; `do update` would need update grants and
  can overwrite data the user set (e.g. categories).

## Conventions
- Parsers are pure functions on `string[][]` rows so they're testable without PDFs.
- Parsers never throw on unknown formats; they add to `warnings`. A clean receipt must have zero warnings
  and its items must add up to the total.
- **Real receipts contain card digits and phone numbers.** Keep them in `receipts/` (git-ignored); it's picked
  up by `albert.local.test.ts`. Anything committed as a fixture must be scrubbed first.

## Status / next up
- [x] Albert PDF parser + tests, upload page that shows parsed items
- [x] Supabase schema, RLS + grants, `save_receipt` function (migrations 0–2), RLS tested with two accounts
- [x] Login / logout, "Save receipt" button (disabled when the receipt has warnings; duplicates rejected)
- [ ] **Next: navigation** – decide React Router (real URLs, back button; suggested) vs. simple page state
- [ ] Review page: list `store_item`s with `category_id is null`, pick or create a category per item
- [ ] Category suggestions: keywords first, then `pg_trgm` similarity for renamed items
- [ ] Manage categories (rename, edit keywords)
- [ ] Parse package size from names ("1L", "500G", "4X55G") into `store_item.size`/`unit` → price per kg / l
- [ ] Search: "mleko" → cheapest per unit by store + own price history
- [ ] Collect more Albert receipts (Albert app was down), especially weighed items (kg) and per-item
      discounts – formats not yet seen
- [ ] PWA manifest, deploy
- [ ] Paper receipts via OCR (Tesseract.js, Czech) – later
- Small: `npm audit fix` for dev-only Vitest advisories; optional unique `chain` table later.
