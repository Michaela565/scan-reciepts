/// <reference types="vite/client" />

// Variables from .env.local. Only names starting with VITE_ are exposed to the browser.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
