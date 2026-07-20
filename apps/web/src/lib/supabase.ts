import { createClient } from '@supabase/supabase-js';

// Supabase client (web). Replaces the Firebase client init (firebase.ts).
// Auth session is persisted in localStorage and auto-refreshed; role/scope
// claims ride in the JWT app_metadata (read in AuthContext).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
