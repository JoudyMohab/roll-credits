import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

// Accounts are optional — the app must keep working locally if these aren't set.
export const supabase = hasSupabaseConfig() ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!) : null
