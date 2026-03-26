import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;
let availabilityCache: boolean | null = null;

function getProjectRef() {
  if (!supabaseUrl) return null;

  try {
    return new URL(supabaseUrl).hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function getAuthStoragePrefix() {
  const projectRef = getProjectRef();
  return projectRef ? `sb-${projectRef}-auth-token` : null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

export async function checkSupabaseAvailability({
  force = false,
  timeoutMs = 3500,
}: {
  force?: boolean;
  timeoutMs?: number;
} = {}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseUrl) {
    availabilityCache = false;
    return false;
  }

  if (!force && availabilityCache !== null) {
    return availabilityCache;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const healthUrl = new URL('/auth/v1/health', supabaseUrl).toString();
    await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    availabilityCache = true;
    return true;
  } catch {
    availabilityCache = false;
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function clearSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return;

  const prefix = getAuthStoragePrefix();
  if (!prefix) return;

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
  } catch {}

  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {}
}

export function hasStoredSupabaseSession(): boolean {
  if (typeof window === 'undefined') return false;

  const prefix = getAuthStoragePrefix();
  if (!prefix) return false;

  try {
    return Object.keys(localStorage).some((key) => key.startsWith(prefix));
  } catch {
    return false;
  }
}
