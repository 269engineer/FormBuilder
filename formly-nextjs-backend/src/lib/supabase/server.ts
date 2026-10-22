import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only client for trusted API routes. Never import this in client components.
 * Routes must authenticate/authorize users before accessing private records.
 */
export function supabaseAdmin() {
  if (!url || !key) throw new Error("Missing Supabase server environment variables.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
