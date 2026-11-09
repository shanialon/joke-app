# CLAUDE.md: בדיחה בלחיצה

## הפרויקט
- אפליקציית "בדיחה בלחיצה": כותבים נושא, מקבלים בדיחה בעברית מ-GPT-5 דרך פונקציה ב-Vercel.
- מסמכי האפיון ב-`spec/`: PRD, MVP, ARCHITECTURE, DESIGN, MILESTONES, tech-stack, product-10-definitions, ומסמך הקורס course-stack.md. תמונות הייחוס (wireframes, mockups, style-guide) גם שם.
- `assets/` נשארת בשורש, כי האפליקציה משתמשת בה. משתמשים בקבצים כמו שהם, בלי לצייר מחדש.
- הסטאק לפי `spec/course-stack.md`: HTML, CSS ו-JavaScript בלי framework ובלי build, ופונקציות בתיקיית `api/`. אין לחרוג מהסטאק בלי לשאול קודם.
- שמירה: Supabase. רק הפונקציות בתיקיית `api/` מדברות איתו, דרך לקוח אחד ב-`lib/supabase.js` (החבילה `@supabase/supabase-js`). הדף מדבר רק עם `/api`, ואין בו כתובת או מפתח של Supabase.

## שפה
- האפליקציה בעברית, מימין לשמאל (`lang="he"`, `dir="rtl"`).
- מדברים איתי בעברית.

## הנחיה שוטפת
- בהקמה ובכל Milestone: להנחות אותי צעד אחר צעד מה השלב הבא. קצר, ענייני וברור.
- לפני ששואלים שאלות: קודם לקרוא את הקבצים, אחר כך לחדד מולי, ורק אז להתחיל.

## מפתחות: חוק ברזל
- לא לבקש ממני אף מפתח.
- לא לכתוב ולא לקרוא מפתח בשום קובץ. `.env` ו-`.env.*` חסומים לקריאה ב-`.claude/settings.json`.
- מפתח ה-production של OpenAI ו-`SUPABASE_SECRET_KEY` שמורים אצלי ב-Vercel (Secret, ב-Production וב-Preview). את המפתחות המקומיים אני מדביקה בעצמי ב-`.env.local`.
- `.env.example` מכיל רק את השורות `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`, בלי ערכים ובלי הערות.
- `.gitignore` מתעלם מ-`.env`, מ-`.env.*` (חוץ מ-`!.env.example`), מ-`.vercel` ומ-`node_modules`.

## Git ו-GitHub
- ריפו ציבורי: https://github.com/shanialon/joke-app, ענף main בלבד.
- לפני כל commit: לוודא ש-`.gitignore`, ‏`.env.example` ו-`.claude/settings.json` קיימים, ושאין קובץ `.env` במעקב.

## פריסה
- הלינק החי ב-Vercel, לא ב-GitHub Pages.
- ב-Milestone 1: להנחות אותי לייבא את הריפו ל-Vercel (Framework Preset: Other) ולשמור בו את המפתח. מאותו רגע כל push ל-main נפרס לבד.
- בסוף כל שלב: לתת לי את הלינק החי.

## עבודה לפי Milestones
- בונים לפי `spec/MILESTONES.md`, Milestone אחרי Milestone. כל Milestone בשיחה חדשה, באותה תיקייה, בשם milestone-1, milestone-2 וכן הלאה.
- לכל Milestone ארבעה שלבים:
  1. **תכנון**
  2. **בנייה**
  3. **הרצה**: כדי שאוכל לבדוק, בכתובת של Vercel או במחשב עם `vercel dev` (http://localhost:3000), לפי מה שאבחר.
  4. **דחיפה**: push ל-main, ואז הלינק החי.
- אחרי התכנון והבנייה של כל Milestone: לתעד ב-`spec/plans/milestone-N.md` (milestone-1.md, milestone-2.md וכן הלאה).
- בסוף כל Milestone עוצרים ומחכים לבדיקה ולאישור מפורש שלי לפני שממשיכים.

## בחירת מודל
- הקמה: Sonnet. ‏Milestone 1 (המסך והעיצוב): Opus. ‏Milestone 2, 3 ו-4: Sonnet, ועוברים ל-Opus אם נתקעים.

## החלטות פתוחות שנקבעו כברירת מחדל
- מודל שמסרב לנושא: מציגים את מה שהוא החזיר.
- מגבלת ההוצאה ב-OpenAI מספיקה כהגנה בשלב הזה.
- בסדר שאותו נושא יחזיר לפעמים אותה בדיחה.
- GPT-5 ייכבה ב-11.12.2026. ב-Milestone 2 לבדוק בתיעוד העדכני של OpenAI את המודל שמחליף אותו, ולהחליף דרך `OPENAI_MODEL`.
