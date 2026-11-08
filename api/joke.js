// Milestone 2: בדיחה מ-OpenAI דרך Responses API.
// המפתח נקרא רק כאן, בשרת, ואף פעם לא חוזר לדף.

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.6-sol"; // המחליף הרשמי של gpt-5, שנכבה ב-11.12.2026

const INSTRUCTIONS =
  "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה.";

const GENERAL_INPUT = "אין נושא. ספר בדיחה כללית על החיים.";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// הטקסט מהתשובה: output_text אם קיים, אחרת החלקים מסוג output_text בפריטי message.
function extractText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const parts = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        parts.push(part.text);
      }
    }
  }
  return parts.join("").trim();
}

// הודעה קצרה בעברית לפי השגיאה מ-OpenAI.
function messageFor(status, code) {
  if (status === 401) return "יש בעיה במפתח של השרת. צריך לבדוק אותו ב-Vercel.";
  if (code === "insufficient_quota" || code === "billing_hard_limit_reached") {
    return "נגמר הקרדיט או שהגענו למגבלת ההוצאה. נסו שוב מאוחר יותר.";
  }
  if (status === 429) return "יותר מדי בקשות כרגע. נסו שוב עוד רגע.";
  if (status === 404 || code === "model_not_found") return "המודל שהוגדר לא נמצא. צריך לבדוק את OPENAI_MODEL.";
  return "הבדיחה לא הגיעה. נסו שוב.";
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

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      console.error("OPENAI_API_KEY is missing");
      return json({ error: "השרת לא מוגדר עדיין. חסר מפתח." }, 500);
    }

    console.log(`joke request: model=${model} topic="${topic}"`);

    let response;
    try {
      response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: INSTRUCTIONS,
          input: topic ? `נושא הבדיחה: ${topic}` : GENERAL_INPUT,
          reasoning: { effort: "low" },
          max_output_tokens: 1500, // כולל את טוקני החשיבה
        }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (error) {
      console.error("OpenAI request failed:", error?.name, error?.message);
      return json({ error: "אין חיבור לשרת הבדיחות. נסו שוב." }, 502);
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      // תשובה שאינה JSON מטופלת למטה
    }

    if (!response.ok) {
      const code = data?.error?.code || data?.error?.type || "unknown";
      console.error(`OpenAI error: status=${response.status} code=${code} message=${data?.error?.message ?? ""}`);
      return json({ error: messageFor(response.status, code) }, 502);
    }

    const joke = extractText(data);
    if (!joke) {
      console.error(
        `OpenAI returned no text: status=${data?.status} reason=${data?.incomplete_details?.reason ?? "none"}`
      );
      return json({ error: "הבדיחה לא הגיעה. נסו שוב." }, 502);
    }

    return json({ joke });
  },
};
