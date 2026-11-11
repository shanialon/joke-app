// Milestone 6: רשימות הבדיחות. new (חדשות), top (הכי מצחיקות), liked (אהבתי).
// new ו-top גם לאורח. liked רק עם טוקן. מחליפה את api/top.js מ-Milestone 4.
import { json, authRequired } from "../lib/http.js";
import { getSupabase, hasToken, getUserFromRequest } from "../lib/supabase.js";

const LIMITS = { new: 20, top: 10, liked: 50 };
const FAILED = "לא הצלחנו לטעון את הרשימה. נסו שוב.";

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json({ error: "אפשר לשלוח רק GET." }, 405);
    }

    const mode = new URL(request.url).searchParams.get("mode") || "new";
    if (!Object.hasOwn(LIMITS, mode)) {
      return json({ error: "סוג הרשימה לא מוכר." }, 400);
    }
    if (mode === "liked" && !hasToken(request)) {
      return authRequired("צריך להתחבר כדי לראות מה אהבת.");
    }

    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error("feed: supabase not configured:", error?.message);
      return json({ error: FAILED }, 500);
    }

    // מי צופה. טוקן לא מוכר: 401. Supabase Auth לא זמין: new ו-top כמו לאורח.
    let viewer = null;
    if (hasToken(request)) {
      try {
        const user = await getUserFromRequest(request, supabase);
        if (!user) return authRequired();
        viewer = user.id;
      } catch (error) {
        console.error("feed: auth check failed:", error?.message);
        if (mode === "liked") return json({ error: FAILED }, 503);
      }
    }

    try {
      const { data, error } = await supabase.rpc("joke_feed", {
        viewer,
        mode,
        max_rows: LIMITS[mode],
      });
      if (error) {
        console.error("joke_feed failed:", error.code, error.message);
        return json({ error: FAILED }, 500);
      }
      // רק השדות שהדף צריך. אף פעם לא user_id.
      const jokes = (data ?? []).map((row) => ({
        id: row.id,
        topic: row.topic,
        text: row.text,
        author_name: row.author_name,
        likes: row.likes ?? 0,
        dislikes: row.dislikes ?? 0,
        my_vote: row.my_vote ?? 0,
        created_at: row.created_at,
      }));
      return json({ jokes });
    } catch (error) {
      console.error("feed request failed:", error?.message);
      return json({ error: FAILED }, 500);
    }
  },
};
