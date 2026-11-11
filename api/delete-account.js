// Milestone 5: מחיקת החשבון של מי ששואל. הבדיחות נשארות, בלי שם ובלי בעלים.
import { json, authRequired } from "../lib/http.js";
import { getSupabase, hasToken, getUserFromRequest } from "../lib/supabase.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "אפשר לשלוח רק POST." }, 405);
    }
    if (!hasToken(request)) return authRequired("צריך להתחבר כדי למחוק חשבון.");

    let supabase;
    let user;
    try {
      supabase = getSupabase();
      user = await getUserFromRequest(request, supabase);
    } catch (error) {
      console.error("delete-account: auth check failed:", error?.message);
      return json({ error: "לא הצלחנו למחוק את החשבון. נסו שוב." }, 503);
    }
    if (!user) return authRequired();

    // קודם מוחקים את השם מהבדיחות. user_id יתאפס לבד במחיקת המשתמש (on delete set null).
    const { error: clearError } = await supabase
      .from("jokes")
      .update({ author_name: null })
      .eq("user_id", user.id);
    if (clearError) {
      console.error("delete-account: clearing names failed:", clearError.code, clearError.message);
      return json({ error: "לא הצלחנו למחוק את החשבון. נסו שוב." }, 500);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("delete-account: deleteUser failed:", deleteError.status, deleteError.message);
      return json({ error: "לא הצלחנו למחוק את החשבון. נסו שוב." }, 500);
    }

    return json({ deleted: true });
  },
};
