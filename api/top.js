// Milestone 4: חמש הבדיחות הכי מצחיקות (לפחות צחוק אחד), מהגבוה לנמוך.
import { getSupabase } from "../lib/supabase.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json({ error: "אפשר לשלוח רק GET." }, 405);
    }

    try {
      const { data, error } = await getSupabase()
        .from("jokes")
        .select("id, text, laughs")
        .gte("laughs", 1)
        .order("laughs", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        console.error("top query failed:", error.code, error.message);
        return json({ error: "לא הצלחנו לטעון את הרשימה." }, 500);
      }
      return json({ top: data ?? [] });
    } catch (error) {
      console.error("top request failed:", error?.message);
      return json({ error: "לא הצלחנו לטעון את הרשימה." }, 500);
    }
  },
};
