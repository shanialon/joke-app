// Milestone 4: מוסיפה צחוק לבדיחה דרך הפונקציה public.add_laugh.
import { getSupabase } from "../lib/supabase.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "אפשר לשלוח רק POST." }, 405);
    }

    let id = "";
    try {
      const body = await request.json();
      if (body && typeof body.id === "string") id = body.id.trim();
    } catch {
      // גוף שבור נחשב id לא תקין
    }

    // בדיקה לפני כל פנייה ל-Supabase
    if (!UUID.test(id)) {
      return json({ error: "מזהה הבדיחה לא תקין." }, 400);
    }

    try {
      const { data, error } = await getSupabase().rpc("add_laugh", { joke_id: id });
      if (error) {
        console.error("add_laugh failed:", error.code, error.message);
        return json({ error: "לא הצלחנו לשמור את הצחוק. נסו שוב." }, 500);
      }
      if (typeof data !== "number") {
        return json({ error: "הבדיחה לא נמצאה." }, 404);
      }
      return json({ laughs: data });
    } catch (error) {
      console.error("laugh request failed:", error?.message);
      return json({ error: "לא הצלחנו לשמור את הצחוק. נסו שוב." }, 500);
    }
  },
};
