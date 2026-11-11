// Milestone 5: כל הכניסה בדפדפן. הספרייה של Supabase משמשת כאן רק ל-/auth/v1:
// הרשמה, כניסה, התנתקות ושמירת הטוקן. הנתונים עוברים רק דרך /api.
// הכתובת והמפתח הציבורי מגיעים מ-/api/config, ולא כתובים בקוד.
window.Auth = (() => {
  let client = null;
  let current = null; // הסשן האחרון שידוע לנו
  const listeners = new Set();

  const NOT_READY = "הכניסה לא זמינה כרגע. נסו שוב עוד רגע.";

  // הודעות שגיאה בעברית, לפי הקוד שחוזר מ-Supabase Auth.
  function hebrew(error) {
    const code = error?.code || "";
    const text = String(error?.message || "").toLowerCase();
    if (error?.name === "AuthRetryableFetchError" || error instanceof TypeError) {
      return "אין חיבור. בדקו את האינטרנט ונסו שוב.";
    }
    if (code === "invalid_credentials" || text.includes("invalid login credentials")) {
      return "המייל או הסיסמה לא נכונים.";
    }
    if (code === "user_already_exists" || code === "email_exists" || text.includes("already registered")) {
      return "המייל הזה כבר רשום. אפשר להיכנס בלשונית \"כניסה\".";
    }
    if (code === "weak_password" || text.includes("password should be")) {
      return "הסיסמה קצרה מדי. צריך לפחות 6 תווים.";
    }
    if (code === "email_address_invalid" || code === "validation_failed" || text.includes("invalid format")) {
      return "כתובת המייל לא נראית תקינה.";
    }
    if (code === "email_not_confirmed") return "צריך לאשר את המייל לפני הכניסה.";
    if (code === "signup_disabled") return "ההרשמה סגורה כרגע.";
    if (code.startsWith("over_") || error?.status === 429) {
      return "יותר מדי ניסיונות. חכו דקה ונסו שוב.";
    }
    return "משהו השתבש. נסו שוב.";
  }

  function emit() {
    for (const fn of listeners) {
      try { fn(current); } catch (error) { console.error(error); }
    }
  }

  // ready: נטען פעם אחת. מחזיר את הסשן (או null). לא נכשל אף פעם.
  const ready = (async () => {
    try {
      if (!window.supabase?.createClient) throw new Error("supabase-js not loaded");
      const response = await fetch("/api/config", { cache: "no-store" });
      const config = await response.json();
      if (!response.ok || !config.url || !config.publishableKey) {
        throw new Error(config.code || "auth config missing");
      }
      client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      const { data } = await client.auth.getSession();
      current = data.session ?? null;
      client.auth.onAuthStateChange((_event, session) => {
        current = session ?? null;
        // מחוץ לקריאה החוזרת, כדי לא לחסום את הספרייה
        setTimeout(emit, 0);
      });
    } catch (error) {
      console.error("auth not available:", error?.message);
      client = null;
    }
    return current;
  })();

  async function need() {
    await ready;
    if (!client) throw new Error(NOT_READY);
  }

  async function signUp(name, email, password) {
    await need();
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new Error("איך לקרוא לך? צריך שם.");
    if (Array.from(cleanName).length > 30) throw new Error("השם ארוך מדי. עד 30 תווים.");
    if (String(password || "").length < 6) throw new Error("הסיסמה קצרה מדי. צריך לפחות 6 תווים.");
    const { data, error } = await client.auth.signUp({
      email: String(email || "").trim(),
      password,
      options: { data: { full_name: cleanName } },
    });
    if (error) throw new Error(hebrew(error));
    // כש-Confirm email כבוי, חוזר סשן. בלי סשן: המייל כבר רשום, או שצריך אישור במייל.
    if (!data.session) {
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error(hebrew({ code: "user_already_exists" }));
      }
      throw new Error("צריך לאשר את המייל לפני הכניסה.");
    }
    current = data.session;
    return current;
  }

  async function signIn(email, password) {
    await need();
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || ""),
    });
    if (error) throw new Error(hebrew(error));
    current = data.session;
    return current;
  }

  // התנתקות מקומית בלבד: רק במכשיר הזה.
  async function signOut() {
    await ready;
    if (client) {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) console.error("signOut:", error.message);
    }
    current = null;
    emit();
  }

  function session() {
    return current;
  }

  // טוקן בתוקף, או null. getSession מרענן אותו לבד כשצריך.
  async function token() {
    await ready;
    if (!client) return null;
    const { data } = await client.auth.getSession();
    current = data.session ?? null;
    return current?.access_token ?? null;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { ready, signUp, signIn, signOut, session, token, onChange };
})();
