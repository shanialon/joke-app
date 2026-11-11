// Milestone 6: הצבעה על בדיחה. אהבתי (1), לא אהבתי (-1) או ביטול (0).
// רק עם טוקן. מי מצביע נקבע לפי הטוקן בלבד, ולא לפי מה שבגוף הבקשה.
import { json, authRequired, readBody } from "../lib/http.js";
import { getSupabase, hasToken, getUserFromRequest } from "../lib/supabase.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALUES = new Set([1, -1, 0]);
const FAILED = "לא הצלחנו לשמור את ההצבעה. נסו שוב.";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "אפשר לשלוח רק POST." }, 405);
    }
    if (!hasToken(request)) return authRequired("כדי לדרג בדיחות צריך חשבון.");

    // בדיקת הגוף לפני כל פנייה ל-Supabase
    const body = await readBody(request);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const value = body.value;
    if (!UUID.test(id)) {
      return json({ error: "מזהה הבדיחה לא תקין." }, 400);
    }
    if (typeof value !== "number" || !VALUES.has(value)) {
      return json({ error: "ההצבעה צריכה להיות 1, ‎-1 או 0." }, 400);
    }

    let supabase;
    let user;
    try {
      supabase = getSupabase();
      user = await getUserFromRequest(request, supabase);
    } catch (error) {
      console.error("vote: auth check failed:", error?.message);
      return json({ error: FAILED }, 503);
    }
    if (!user) return authRequired();

    try {
      const { data, error } = await supabase.rpc("cast_vote", {
        voter: user.id,
        target: id,
        new_value: value,
      });
      if (error) {
        if (error.code === "23503") return json({ error: "הבדיחה לא נמצאה." }, 404);
        if (error.code === "22023") return json({ error: "ההצבעה צריכה להיות 1, ‎-1 או 0." }, 400);
        console.error("cast_vote failed:", error.code, error.message);
        return json({ error: FAILED }, 500);
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return json({ error: "הבדיחה לא נמצאה." }, 404);
      return json({
        likes: row.likes ?? 0,
        dislikes: row.dislikes ?? 0,
        my_vote: row.my_vote ?? 0,
      });
    } catch (error) {
      console.error("vote request failed:", error?.message);
      return json({ error: FAILED }, 500);
    }
  },
};
