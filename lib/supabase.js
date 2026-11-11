// הלקוח היחיד של Supabase. המקום היחיד שקורא את SUPABASE_SECRET_KEY.
// רק הפונקציות בתיקיית api משתמשות בו. הדף לא פונה ל-Supabase לנתונים.
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

// הטוקן מהכותרת Authorization: Bearer <token>, או מחרוזת ריקה.
function tokenFrom(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : "";
}

export function hasToken(request) {
  return tokenFrom(request) !== "";
}

// מי שואל, לפי הטוקן בלבד. טוקן ש-Supabase לא מכיר: null.
// Supabase לא זמין (רשת, 5xx, משתנים חסרים): זורקת שגיאה.
export async function getUserFromRequest(request, supabase) {
  const token = tokenFrom(request);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    const status = error.status ?? 0;
    if (status >= 400 && status < 500) return null;
    throw error;
  }
  return data?.user ?? null;
}

// השם לתצוגה: user_metadata.full_name, עד 30 תווים. אין שם: null.
export function displayName(user) {
  const name = user?.user_metadata?.full_name;
  if (typeof name !== "string") return null;
  const trimmed = Array.from(name.trim()).slice(0, 30).join("").trim();
  return trimmed || null;
}
