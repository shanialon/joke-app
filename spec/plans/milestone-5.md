# Milestone 5: האפליקציה מכירה אותך

## מה נבנה
- **Supabase**: migration בשם `add_joke_authors`, עותק ב-`db/add_joke_authors.sql`.
  - בטבלה `public.jokes`: ‏`user_id` (uuid, ‏references `auth.users (id)` on delete set null) ו-`author_name` (text). שתיהן לא חובה.
  - check בשם `jokes_author_name_length`: ‏null, או 1 עד 30 תווים אחרי btrim.
  - אינדקס `jokes_user_id_idx`.
  - הנעילה לא השתנתה. 32 השורות הקיימות נשארו, עם null בעמודות החדשות.
  - `get_advisors`: ‏`rls_enabled_no_policy` (INFO, מכוון, כמו ב-Milestone 4) ו-`unused_index` על האינדקס החדש (INFO, טבעי לאינדקס חדש).
- **lib/http.js**: ‏`json` (תמיד `Cache-Control: no-store`), ‏`authRequired` (‏401 עם `code: "auth_required"`), ו-`readBody` עם מגבלה של 4KB.
- **lib/supabase.js**: נשאר הלקוח היחיד עם המפתח הסודי. נוספו `hasToken`, ‏`getUserFromRequest` (‏4xx מ-Supabase נותן null, ושגיאת רשת או 5xx נזרקת) ו-`displayName` (‏`user_metadata.full_name`, עד 30 תווים).
- **api/config.js**: ‏GET. מחזירה `{ url, publishableKey }`. משתנה חסר, או מפתח שמתחיל ב-`sb_secret_` או זהה למפתח הסודי: ‏500 עם `auth_not_configured`.
- **api/joke.js**: עם טוקן, המשתמש מזוהה לפני OpenAI. טוקן לא מוכר: ‏401, בלי פנייה ל-OpenAI. Supabase לא זמין: הבדיחה חוזרת בלי שמירה. מחזירה `{ joke, id, author_name }`.
- **api/delete-account.js**: ‏POST עם טוקן. מנקה את `author_name` בבדיחות של המשתמש, ואז `auth.admin.deleteUser`. ‏`user_id` מתאפס לבד.
- **auth.js**: ‏`Auth.ready`, ‏`signUp`, ‏`signIn`, ‏`signOut` (scope מקומי), ‏`session`, ‏`token` (async, מרענן לבד) ו-`onChange`. ‏`flowType: "pkce"`. הודעות שגיאה בעברית לפי קוד השגיאה.
- **index.html**:
  - ‏`@supabase/supabase-js@2.119.0` מ-jsDelivr עם SRI, ואחריו `/auth.js`.
  - כפתור חשבון בפינה העליונה בצד שמאל.
  - חלון כניסה והרשמה (dialog, שתי לשוניות).
  - חלון "החשבון שלי", עם מחיקה שמבקשת אישור.
  - כל קריאה ל-/api עוברת דרך `api()`, ששולחת את הטוקן. ‏401 עם `auth_required` כשנשלח טוקן: התנתקות, ו"צריך להתחבר שוב".
  - מתחת לבדיחה: "נכתבה עכשיו בשבילך, " והשם, עם textContent.
  - "צחקתי" ו"הכי מצחיקות" לא השתנו.
- **sw.js**: ‏`joke-v3`, ו-`/auth.js` ברשימת הקבצים.

## משתנים
- `SUPABASE_PUBLISHABLE_KEY` נוסף ב-Vercel (לא Sensitive, בכל הסביבות). זה מפתח ציבורי.
- `.env.example` לא השתנה.

## ביד ב-Supabase
- Authentication ← Sign In / Providers: ההרשמה דולקת, ו-Confirm email כבוי.
- Authentication ← URL Configuration: ‏Site URL הכתובת ב-Vercel. ב-Redirect URLs אותה כתובת עם `/**`, וגם `http://localhost:3000/**`.

## בדיקות מול תנאי ההשלמה
נבדק ב-Vercel אחרי הדחיפה: בדיחה של אורח, הרשמה, בדיחה של משתמש מחובר, שלוש הודעות השגיאה, התנתקות וכניסה עם רענון, מחיקת חשבון, Network רק ל-/auth/v1, ו-/api/config.
