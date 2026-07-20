// Shared service-role Supabase client. The service-role key bypasses RLS so the
// exporters can read every row (users, books, libraries, auth.users).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
      "before running an export (see README.md)."
  );
  process.exit(1);
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
