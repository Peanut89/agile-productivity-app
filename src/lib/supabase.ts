import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the app has been given Supabase credentials (env vars). */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The shared Supabase client, or null when sync isn't configured yet so the
 * app still runs fully offline/local-only.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PWA uses email OTP codes, not magic-link redirects.
        detectSessionInUrl: false,
      },
    })
  : null
