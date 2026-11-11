// Milestone 5: הכתובת והמפתח הציבורי של Supabase, בשביל הכניסה בדפדפן.
// אף פעם לא מחזירה מפתח סודי.
import { json } from "../lib/http.js";

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json({ error: "אפשר לשלוח רק GET." }, 405);
    }

    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    // חסר משתנה, או שבטעות הוכנס מפתח סודי: לא מחזירים כלום.
    const looksSecret =
      typeof publishableKey === "string" &&
      (publishableKey.startsWith("sb_secret_") || publishableKey === process.env.SUPABASE_SECRET_KEY);

    if (!url || !publishableKey || looksSecret) {
      console.error("auth config missing or invalid");
      return json({ error: "הכניסה עוד לא מוגדרת בשרת.", code: "auth_not_configured" }, 500);
    }

    return json({ url, publishableKey });
  },
};
