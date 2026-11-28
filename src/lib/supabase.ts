import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const rawAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

function isValidHttpUrl(value: string): boolean {
  if (!value || value === 'undefined' || value === 'null') return false;
  if (value.includes('your-project-ref')) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function createSafeSupabaseClient(): {
  client: SupabaseClient | null;
  configured: boolean;
} {
  if (!isValidHttpUrl(rawUrl) || !rawAnonKey || rawAnonKey === 'undefined' || rawAnonKey === 'null') {
    return { client: null, configured: false };
  }
  try {
    const client = createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return { client, configured: true };
  } catch {
    return { client: null, configured: false };
  }
}

const { client, configured } = createSafeSupabaseClient();

export const isSupabaseConfigured = configured;
export const supabase: SupabaseClient | null = client;
