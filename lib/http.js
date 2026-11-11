// עזרים קטנים לכל הפונקציות בתיקיית api.

// תשובת JSON. אף פעם לא נשמרת במטמון, כי היא תלויה במי ששואל.
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// צריך להתחבר (או להתחבר שוב).
export function authRequired(message = "צריך להתחבר שוב.") {
  return json({ error: message, code: "auth_required" }, 401);
}

// קריאת גוף JSON עם מגבלת גודל. גוף שבור, ריק או גדול מדי: אובייקט ריק.
export async function readBody(request, maxBytes = 4096) {
  try {
    const text = await request.text();
    if (!text || new TextEncoder().encode(text).length > maxBytes) return {};
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}
