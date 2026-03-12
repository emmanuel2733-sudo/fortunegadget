import { createClient } from "@supabase/supabase-js";

const env = import.meta.env;

export const supabaseUrl = (env.REACT_APP_SUPABASE_URL || "").trim();
export const supabaseAnonKey = (env.REACT_APP_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseInitError = isSupabaseEnabled
  ? ""
  : "Missing Supabase env keys: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY";

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export default supabase;
