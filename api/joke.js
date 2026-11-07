// Milestone 1: בדיחה זמנית, בלי AI. מדווחת רק אם המפתח קיים, אף פעם לא את המפתח עצמו.

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

    let topic = "";
    try {
      const body = await request.json();
      if (body && typeof body.topic === "string") {
        topic = body.topic.trim().slice(0, 100);
      }
    } catch {
      // גוף שבור נחשב "אין נושא"
    }

    const hasKey = Boolean(process.env.OPENAI_API_KEY);
    console.log(`joke request: topic="${topic}" key=${hasKey ? "found" : "missing"}`);

    const shown = topic || "בלי נושא";
    return json({
      joke: `בדיחה זמנית מהשרת: ${shown}. המפתח: ${hasKey ? "נמצא" : "חסר"}`,
    });
  },
};
