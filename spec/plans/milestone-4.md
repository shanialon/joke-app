# Milestone 4: האפליקציה זוכרת

## מה נבנה
- **Supabase** (פרויקט `joke-in-a-click`): migration בשם `create_jokes`, עותק ב-`db/create_jokes.sql`.
  - הטבלה `public.jokes`: ‏id, ‏created_at, ‏topic, ‏text, ‏laughs.
  - RLS מופעל בלי policy. ‏`grant select, insert, update` ל-`service_role` בלבד, ו-`revoke all` מ-`anon` ומ-`authenticated`.
  - הפונקציה `public.add_laugh(joke_id uuid)`: ‏update אחד שמחזיר את המונה החדש. ‏`security invoker`, ‏`search_path` ריק, ‏execute ל-`service_role` בלבד.
  - `get_advisors`: ממצא אחד ברמת INFO, `rls_enabled_no_policy`, והוא מכוון. אין ממצאי ביצועים.
- **lib/supabase.js**: הלקוח היחיד. קורא `SUPABASE_URL` ו-`SUPABASE_SECRET_KEY`, ונוצר בפעם הראשונה שצריך אותו.
- **api/joke.js**: אחרי שהבדיחה מ-OpenAI מוכנה, נשמרת שורה בטבלה, ומוחזר `{ joke, id }`. אם השמירה נכשלת: ‏console.error, ומוחזר `{ joke }` בלי id.
- **api/laugh.js**: ‏POST עם `{ id }`. לא uuid: ‏400 בלי פנייה ל-Supabase. ‏rpc ל-`add_laugh`. מחזירה `{ laughs }`, ‏404 כשאין בדיחה כזו, ‏500 בשגיאה.
- **api/top.js**: ‏GET. עד חמש בדיחות עם `laughs >= 1`, מהגבוה לנמוך. מחזירה `{ top: [{ id, text, laughs }] }`.
- **index.html**: כפתור "צחקתי" בתוך הבועה, שמופיע רק כשיש id. אחרי לחיצה הוא ננעל ומציג את המונה. הרשימה "הכי מצחיקות" נטענת בטעינה ואחרי כל צחוק, בלי polling. הכול מוצג עם textContent, והדף פונה רק ל-/api.
- **sw.js**: ‏`joke-v2`, כבר מעודכן. ‏/api לא נשמר במטמון.

## משתנים
- `SUPABASE_URL` (Config) ו-`SUPABASE_SECRET_KEY` (Secret) ב-Vercel, ב-Production וב-Preview. הוגדרו על ידי המשתמשת.
- הרצה מקומית: שני המשתנים ב-`.env.local`, ביד. ‏`SUPABASE_URL` לא נמצא ב-`.env.example`, ולכן מוסיפים אותו ל-`.env.local` ידנית.

## בדיקות מול תנאי ההשלמה
צריך לבדוק בהרצה: שמירת שורה, כפתור שננעל, רשימה שמתעדכנת, Network רק ל-/api, חיפוש `supabase` ו-`sb_secret` בקוד הדף, פנייה עם anon נדחית, Supabase לא זמין, ו-/api/laugh עם id שאינו uuid.
