// הלקוח היחיד של Supabase. המקום היחיד שקורא את SUPABASE_SECRET_KEY.
// רק הפונקציות בתיקיית api משתמשות בו. הדף לא פונה ל-Supabase.
import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is missing");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
