import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

/**
 * The one Supabase client for the whole app. It uses the publishable key, so it can only do
 * what the grants and RLS policies in supabase/migrations allow for the signed-in user.
 * It also remembers the session in localStorage, so you stay signed in after a reload.
 */
export const supabase = createClient(url, key)
