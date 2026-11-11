# ARCHITECTURE: בדיחה בלחיצה

המסמך מתאר את המערכת אחרי Milestone 6. מה שנוסף ב-Milestone 5, ב-Milestone 6 ובבונוס של Google מסומן כך.

## עקרונות שלא משתנים
- הדף מדבר רק עם /api. הוא לא קורא ולא כותב אף טבלה.
- הספרייה של Supabase בדפדפן משמשת רק לכניסה: הרשמה, כניסה, התנתקות ושמירת הטוקן. כתובת הפרויקט והמפתח הציבורי מגיעים מ-/api/config.
- כל פונקציה שצריכה לדעת מי שואל מקבלת את הטוקן בכותרת Authorization, ושואלת את Supabase עם supabase.auth.getUser(token). מזהה משתמש או שם שמגיעים מהדף, לא נחשבים.
- כל טבלה נעולה: RLS דולק בלי policy, revoke all מ-anon ומ-authenticated, ו-grant רק ל-service_role. כל פונקציה בבסיס הנתונים: revoke execute מ-public, anon ו-authenticated, ו-grant ל-service_role.
- כל SQL נשמר קודם כקובץ בתיקייה db, מוצג לי, ורץ דרך המחבר של Supabase רק אחרי אישור.
- כל טקסט מהשרת או מהמשתמש מוצג עם textContent, אף פעם לא innerHTML.
- אין טעינה בטיימר (polling). רשימה נטענת כשנכנסים ללשונית, ואחרי פעולה.

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- Milestone 5: auth.js בשורש מרכז את כל הכניסה בדפדפן, עם הספרייה `@supabase/supabase-js` מ-jsDelivr, בגרסה קבועה. היא מקבלת את הכתובת ואת המפתח הציבורי מ-/api/config, ומשמשת רק ל-/auth/v1: הרשמה, כניסה, התנתקות ושמירת הטוקן. flowType של pkce.
- Milestone 5: כל קריאה ל-/api שולחת את הטוקן בכותרת `Authorization: Bearer <token>`, אם יש. תשובת 401 עם `code: "auth_required"` כשנשלח טוקן: הדף מתנתק לבד, וכותב "צריך להתחבר שוב".
- Milestone 6: שלוש לשוניות בתחתית, כל אחת כתובת עם #: ‏‎#joke, ‏‎#community, ‏‎#liked. רכיב הצבעה אחד, "אהבתי" ו"לא אהבתי", בכל מקום שיש בדיחה. הרשימות נטענות מ-/api/feed כשנכנסים ללשונית, אחרי הצבעה, ואחרי כניסה או יציאה.
- "צחקתי" ו"הכי מצחיקות" של Milestone 4 מתחלפים ב-Milestone 6 ברכיב ההצבעה ובלשונית הקהילה.
- אין בדף מפתח סודי. הכתובת של Supabase והמפתח הציבורי מגיעים רק מ-/api/config, ולא כתובים בקוד הדף.
- הטקסט שחוזר מוצג עם textContent, לא innerHTML.
- רושם את sw.js כ-service worker.

### לוגיקה
- Vercel Functions בתיקיית api, כל אחת עם `export default { async fetch(request) { ... } }`:
  - api/joke.js: מקבלת POST עם `{ "topic": "..." }`. חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא". פונה ל-OpenAI, מחלצת את הטקסט, שומרת את הבדיחה בטבלה, ומחזירה את הבדיחה ואת ה-id שלה. אם השמירה נכשלת, הבדיחה עדיין חוזרת, והשגיאה נרשמת ב-console.error.
  - Milestone 5, ב-api/joke.js: אם יש טוקן, מזהים את המשתמש לפני הקריאה ל-OpenAI. טוקן ש-Supabase לא מכיר: 401 עם auth_required, בלי לפנות ל-OpenAI. Supabase לא זמין: הבדיחה בכל זאת מגיעה, בלי שמירה. בשמירה: user_id ו-author_name מהטוקן, ואף פעם לא מהגוף.
  - Milestone 5: api/config.js, GET בלבד. מחזירה `{ url, publishableKey }` מ-SUPABASE_URL ומ-SUPABASE_PUBLISHABLE_KEY. אם אחד חסר, או שהמפתח במשתנה הוא מפתח סודי: 500, וקוד auth_not_configured. אף פעם לא מחזירה מפתח סודי.
  - Milestone 5: api/delete-account.js, POST עם טוקן בלבד. קודם מנקה את author_name בבדיחות של המשתמש, ואז `supabase.auth.admin.deleteUser`. הבדיחות נשארות, בלי שם ובלי בעלים.
  - Milestone 6: api/vote.js, POST עם טוקן בלבד. הגוף `{ id, value }`: ‏id חייב להיות uuid, ו-value הוא 1, 1- או 0 בדיוק, כמספר. קוראת ל-`cast_vote` דרך rpc, עם voter מהטוקן. user_id בגוף לא נחשב. בדיחה שלא קיימת: 404.
  - Milestone 6: api/feed.js, GET עם mode של new, top או liked. new ו-top גם לאורח. liked רק עם טוקן, אחרת 401. קוראת ל-`joke_feed` דרך rpc. כמות השורות: 20 ל-new, 10 ל-top, 50 ל-liked. אף פעם לא מחזירה user_id.
  - Milestone 6: api/laugh.js ו-api/top.js נמחקות. feed.js מחליפה את top.js.
- רק הפונקציות בתיקיית api מדברות עם Supabase על נתונים, דרך לקוח אחד ב-lib/supabase.js, עם המפתח הסודי.
- Milestone 5: lib/supabase.js מוסיפה שלוש פונקציות: `hasToken(request)`, ‏`getUserFromRequest(request, supabase)` שמחזירה את המשתמש או null, וזורקת שגיאה כש-Supabase לא זמין, ו-`displayName(user)` שמחזירה את `user_metadata.full_name`, עד 30 תווים. זיהוי משתמש נעשה רק עם `supabase.auth.getUser(token)`.
- Milestone 5: lib/http.js, עזרים קטנים: תשובת JSON עם `Cache-Control: no-store`, תשובת 401 עם `code: "auth_required"`, וקריאת גוף עם מגבלת גודל.

### נתונים
- Supabase (Postgres). רק השרת ניגש לטבלאות, עם המפתח הסודי.
- הטבלאות: `public.jokes`, ומ-Milestone 6 גם `public.votes`.
- Milestone 5: המשתמשים ב-Supabase Auth, בטבלה `auth.users`. השם לתצוגה ב-`user_metadata.full_name`.

## 2. מבנה הנתונים

### הטבלה public.jokes
מה-migration `create_jokes` (עותק ב-db/create_jokes.sql), ומ-Milestone 5 גם `add_joke_authors` (עותק ב-db/add_joke_authors.sql):

| עמודה | סוג | הערות |
|---|---|---|
| id | uuid | מפתח ראשי, ברירת מחדל `gen_random_uuid()` |
| created_at | timestamptz | ברירת מחדל `now()` |
| topic | text | הנושא, יכול להיות ריק |
| text | text | חובה. הבדיחה |
| laughs | integer | חובה, ברירת מחדל 0. מ-Milestone 4. נשארת בבסיס הנתונים, אבל מ-Milestone 6 האפליקציה לא משתמשת בה |
| user_id | uuid | Milestone 5. לא חובה. `references auth.users (id) on delete set null`. אינדקס. null לאורח |
| author_name | text | Milestone 5. לא חובה. check: ‏null, או בין 1 ל-30 תווים אחרי btrim |

### הטבלה public.votes
Milestone 6, מה-migration `create_votes` (עותק ב-db/create_votes.sql):

| עמודה | סוג | הערות |
|---|---|---|
| user_id | uuid | חובה. `references auth.users (id) on delete cascade` |
| joke_id | uuid | חובה. `references public.jokes (id) on delete cascade`. אינדקס |
| value | smallint | חובה. check: ‏1- או 1 |
| voted_at | timestamptz | חובה, ברירת מחדל `now()` |

- המפתח הראשי: `(user_id, joke_id)`. זו השורה שמבטיחה קול אחד לכל משתמש לכל בדיחה.
- מחיקת משתמש מוחקת את ההצבעות שלו, והמספרים יורדים.

### הנעילה
- בכל טבלה: RLS מופעל, בלי אף policy. `revoke all` מ-`anon` ומ-`authenticated`.
- `public.jokes`: ‏`grant select, insert, update` ל-`service_role` בלבד.
- `public.votes`: ‏`grant select, insert, update, delete` ל-`service_role` בלבד.

### הפונקציות בבסיס הנתונים
- `public.add_laugh(joke_id uuid)`: מ-Milestone 4. מוסיפה 1 ל-`laughs` בפקודת update אחת. נשארת בבסיס הנתונים, אבל מ-Milestone 6 האפליקציה לא קוראת לה.
- Milestone 6: `public.cast_vote(voter uuid, target uuid, new_value smallint)`, ב-plpgsql. 1 או 1-: ‏insert עם `on conflict (user_id, joke_id) do update` של value ו-voted_at. ‏0: מוחקת את ההצבעה. כל ערך אחר: שגיאה. מחזירה שורה אחת: likes, ‏dislikes ו-my_vote של הבדיחה.
- Milestone 6: `public.joke_feed(viewer uuid, mode text, max_rows integer default 20)`, ב-sql, ‏stable. מחזירה id, ‏created_at, ‏topic, ‏text, ‏author_name, ‏likes, ‏dislikes ו-my_vote. שלושה מצבים:
  - new: לפי created_at, מהחדש.
  - top: רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes, ואז לפי likes.
  - liked: רק בדיחות ש-viewer סימן בהן 1, לפי voted_at.
  - viewer הוא null לאורח. max_rows בין 1 ל-50.
- בכל הפונקציות: `security invoker`, ‏`set search_path = ''`, ושמות מלאים כמו `public.votes`. `revoke execute` מ-`public`, ‏`anon` ו-`authenticated`, ו-`grant execute` ל-`service_role`.
- אחרי כל migration: ‏`get_advisors`, הסבר בעברית מה נמצא, ועצירה.

### החוזה בין הדף לפונקציות, אחרי Milestone 6

| הפונקציה | בקשה | טוקן | תשובה |
|---|---|---|---|
| /api/config | GET | לא | `{ url, publishableKey }` |
| /api/joke | POST `{ topic }` | רשות | `{ joke, id, author_name }`. ‏author_name הוא null לאורח |
| /api/feed?mode=new או top | GET | רשות | `{ jokes: [{ id, topic, text, author_name, likes, dislikes, my_vote, created_at }] }` |
| /api/feed?mode=liked | GET | חובה | כמו למעלה |
| /api/vote | POST `{ id, value }` | חובה | `{ likes, dislikes, my_vote }` |
| /api/delete-account | POST | חובה | `{ deleted: true }` |

- שגיאה: `{ error: "הודעה קצרה בעברית" }`. כשצריך להתחבר: 401 עם `{ error, code: "auth_required" }`.
- כל התשובות עם `Cache-Control: no-store`, כי הן תלויות במי ששואל.
- בקשה בשיטה הלא נכונה: 405 עם JSON.

## 3. התחברות והרשאות
- עד Milestone 4: אין כניסה, רמה 0.
- מ-Milestone 5: רמה 3 לפי course-stack.md. משתמשים אמיתיים עם הרשמה עצמית, ב-Supabase Auth, עם מייל וסיסמה. Confirm email כבוי.
- מה מותר למי:
  - אורח: מבקש בדיחות, קורא את הקהילה (new ו-top) ורואה את המספרים. כדי להצביע או לראות את "אהבתי" צריך חשבון.
  - מחובר: כל מה שאורח יכול, ועוד: בדיחה נשמרת עם השם שלו, קול אחד לכל בדיחה, הרשימה "אהבתי", התנתקות ומחיקת חשבון.
- הטוקן:
  - הדפדפן מקבל אותו מ-Supabase Auth דרך auth.js, ושולח אותו בכותרת `Authorization: Bearer <token>` בכל קריאה ל-/api.
  - הפונקציות מזהות את המשתמש רק עם `supabase.auth.getUser(token)`. מזהה משתמש או שם שמגיעים מהדף, לא נחשבים.
  - טוקן ש-Supabase לא מכיר: 401 עם `auth_required`.
- ב-Supabase, ביד: Allow new users to sign up דולק, Confirm email כבוי. ב-URL Configuration: ‏Site URL הכתובת ב-Vercel, וב-Redirect URLs אותה כתובת עם `/**`, ולמי שמריץ במחשב גם `http://localhost:3000/**`.
- בונוס, כניסה עם Google: אותו טוקן ואותן פונקציות, ובשרת לא משתנה כלום. auth.js קוראת ל-`signInWithOAuth` עם provider של google, ו-redirectTo לכתובת האתר עם / בסוף. לפני היציאה בודקים ב-`/auth/v1/settings` ש-Google דולק. בחזרה הספרייה מחליפה את `?code=` בטוקן (pkce), והכתובת מתנקה. מה שהמשתמש עשה נשמר ב-sessionStorage לפני היציאה ומשוחזר בחזרה.
- ההגנה על העלות נשארת: אורך נושא מוגבל, ומגבלת הוצאה בחשבון OpenAI.

## 4. שכבת ה-AI
- הקריאה: POST אל `https://api.openai.com/v1/responses`, מתוך הפונקציה בלבד, עם הכותרת `Authorization: Bearer <OPENAI_API_KEY>`.
- הגוף: `model` מ-OPENAI_MODEL או `gpt-5`, ‏`instructions` עם הפרומפט המרכזי, `input` עם הנושא, ‏`reasoning: { effort: "low" }` ו-`max_output_tokens`.
- הפרומפט המרכזי: "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה."
- ה-input: "נושא הבדיחה: [הנושא]". בלי נושא: "אין נושא. ספר בדיחה כללית על החיים."
- התשובה: לוקחים את `output_text` אם קיים. אחרת, את הטקסט מהפריטים מסוג `message` במערך `output`, בחלקים מסוג `output_text`. אין טקסט: שגיאה.
- שגיאה מ-OpenAI: הסטטוס והקוד נרשמים ב-console.error, והדף מקבל הודעה קצרה בעברית לפי הקוד: 401, נגמר הקרדיט, מגבלת הוצאה, 429, 404.
- לפני כתיבת הקוד בודקים בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה.

## 5. אינטגרציות, APIs ואוטומציות
- OpenAI Responses API, מ-api/joke.js.
- Supabase, דרך `@supabase/supabase-js`, מהפונקציות בתיקיית api, לנתונים ולזיהוי המשתמש.
- Milestone 5: Supabase Auth מהדפדפן, דרך auth.js, רק לנתיב /auth/v1. אין אף בקשה מהדפדפן ל-/rest/v1.
- בונוס: Google כספק OAuth, מוגדר בדשבורד של Supabase וב-Google Cloud Console.
- אין אוטומציות.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק הפונקציה קוראת אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל |
| SUPABASE_URL | Vercel, Environment Variables, בכל הסביבות | Config | כתובת הפרויקט ב-Supabase |
| SUPABASE_SECRET_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק lib/supabase.js קורא אותו. אני שמה אותו בעצמי |
| SUPABASE_SECRET_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מודבק ביד |
| SUPABASE_PUBLISHABLE_KEY | Vercel, Environment Variables, בכל הסביבות | Config. חדש ב-Milestone 5 | המפתח הציבורי של Supabase. רק api/config.js קורא אותו ומחזיר אותו לדף. הוא לא סוד, ו-Claude יכול להביא אותו דרך המחבר, עם get_publishable_keys |
| Client Secret של Google | רק בדשבורד של Supabase, בספק Google | בונוס | לא בקוד, לא בריפו ולא ב-Vercel |

- המפתחות הסודיים לא מופיעים בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- מפתח ה-production נשמר ב-Vercel כבר ב-Milestone 1. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים. הוא לא משתנה ב-Milestone 5: המפתח הציבורי אינו סוד, ולכן הוא לא בקובץ. שם המודל לא נכנס לקובץ.
- הדפדפן לא מקבל אף מפתח סודי. מ-Milestone 5 הוא מקבל מ-/api/config את כתובת Supabase ואת המפתח הציבורי בלבד, ומשתמש בהם רק לכניסה. ב-Ctrl+U אין sb_publishable_ ואין sb_secret_.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`. הוא נוצר לפני הקומיט הראשון.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html              המסך, עם ה-CSS וה-JavaScript. טוען את supabase-js מ-jsDelivr ואת auth.js
auth.js                 Milestone 5. כל הכניסה בדפדפן: הרשמה, כניסה, התנתקות, הטוקן. בבונוס גם google()
manifest.webmanifest    name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                   service worker, network-first, בלי /api
package.json            "type": "module", ו-dependency אחת: @supabase/supabase-js
.gitignore              .env, .env.*, !.env.example, .vercel, node_modules
.env.example            שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים ובלי הערות
.claude/settings.json   חוסם ל-Claude את הקריאה של .env ושל .env.*
assets/logo.svg
assets/mascot-idle.svg, mascot-think.svg, mascot-joke.svg, mascot-error.svg
assets/bg-dots.svg, bg-doodles.svg
assets/icon.svg, icon-maskable.svg
assets/icon-192.png, icon-512.png, icon-512-maskable.png
api/joke.js             בדיחה מ-OpenAI, ושמירה בטבלה עם המחבר. המקום היחיד שקורא את מפתח OpenAI
api/config.js           Milestone 5. כתובת Supabase והמפתח הציבורי בלבד
api/delete-account.js   Milestone 5. מחיקת החשבון של מי ששולח את הטוקן
api/vote.js             Milestone 6. הצבעה דרך cast_vote
api/feed.js             Milestone 6. new, top ו-liked דרך joke_feed. מחליפה את api/top.js
lib/supabase.js         הלקוח היחיד של Supabase בשרת. המקום היחיד שקורא את SUPABASE_SECRET_KEY. hasToken, getUserFromRequest, displayName
lib/http.js             Milestone 5. תשובות JSON עם no-store, תשובת 401, וקריאת גוף עם מגבלת גודל
db/create_jokes.sql     עותק של ה-migration create_jokes
db/add_joke_authors.sql Milestone 5. עותק של ה-migration add_joke_authors
db/create_votes.sql     Milestone 6. עותק של ה-migration create_votes
spec/                   מסמכי האיפיון, ו-spec/plans
```

- Milestone 6: מוחקים את api/laugh.js ואת api/top.js.

ה-service worker:
- באירוע install שומר במטמון את /, את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים. מ-Milestone 5 גם את /auth.js.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api, בקשה שאינה GET, או בקשה לכתובת אחרת (כולל supabase.co ו-jsDelivr): לא נוגע בה.
- שם המטמון כולל גרסה (`joke-v2` אחרי Milestone 4). כל שינוי בדף מעלה את הגרסה, ב-Milestone 5 וב-Milestone 6, והגרסאות הישנות נמחקות ב-activate.

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript של המסך בתוך index.html. רק הכניסה יוצאת לקובץ נפרד, auth.js, כי היא נוגעת בכל הלשוניות.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
- Milestone 6: העמודה laughs והפונקציה add_laugh נשארות בבסיס הנתונים. לא מוחקים נתונים. האפליקציה פשוט מפסיקה להשתמש בהן.
- flowType של pkce כבר ב-Milestone 5, כדי שהבונוס של Google יעבוד בלי לשנות את auth.js מהיסוד.
