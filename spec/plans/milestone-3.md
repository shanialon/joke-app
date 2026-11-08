# Milestone 3: התקנה בטלפון

## תכנון

### המטרה
מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא.

### איך מתקינים בטלפון (לבדיקה של תנאי השלמה 2)
אנדרואיד, ב-Chrome: פותחים את הכתובת, לוחצים על שלוש הנקודות בפינה, ובוחרים "התקנת אפליקציה" או "הוספה למסך הבית". השם משתנה בין גרסאות.

אייפון, ב-Safari: פותחים את הכתובת, לוחצים על כפתור השיתוף, ובוחרים "הוספה למסך הבית". מ-iOS 16.4 זה עובד גם מ-Chrome, Edge ו-Firefox.

### הקבצים
| הקובץ | מה משתנה |
|---|---|
| `manifest.webmanifest` | חדש. השם, הצבעים, הכיוון והאייקונים |
| `sw.js` | חדש. service worker בגישת network-first, בלי /api |
| `index.html` | קישור ל-manifest, ‏`theme-color`, אייקונים, ורישום של sw.js |

### manifest.webmanifest
- `name`: "בדיחה בלחיצה". ‏`short_name`: "בדיחה" (השם מתחת לאייקון במסך הבית, ושם יש מקום לכ-12 תווים).
- `start_url` ו-`scope`: `/`. ‏`display`: `standalone`. ‏`lang`: `he`. ‏`dir`: `rtl`.
- `theme_color` ו-`background_color`: ‏`#FFE15A`.
- אייקונים מתיקיית assets, כמו שהם: ‏`icon-192.png`, ‏`icon-512.png`, ו-`icon-512-maskable.png` עם `purpose: maskable`.

### sw.js, לפי סעיף 7 ב-ARCHITECTURE.md
- install: שומר במטמון את `/`, את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים (192 ו-512).
- activate: מוחק מטמונים ישנים, לפי שם גרסה (`joke-v1`).
- כל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api, בקשה שאינה GET, או בקשה לכתובת אחרת (למשל Google Fonts): לא נוגע בה.
- בזכות network-first, שינוי שנדחף מופיע ברענון הבא.

### index.html
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color" content="#FFE15A">`
- `<link rel="icon">` ו-`<link rel="apple-touch-icon">` עם `assets/icon-192.png`. האייפון לא קורא אייקונים מה-manifest, ולכן צריך את השורה השנייה.
- רישום של `/sw.js` אחרי טעינת הדף, רק אם הדפדפן תומך.

### הרצה
בכתובת של Vercel, אחרי push, ובדיקה בטלפון לפי ההוראות למעלה.

## בנייה

### מה נבנה
- `manifest.webmanifest`: כמו בתכנון. נוסף גם `description`.
- `sw.js`: מטמון בשם `joke-v1`. ההתקנה שומרת את `/`, את ה-manifest, את כל קבצי ה-SVG מתיקיית assets ואת `icon-192.png` ו-`icon-512.png`. כשאין רשת ואין עותק של הדף המבוקש, מוחזר `/`.
- `index.html`: ‏`theme-color`, קישור ל-manifest, ‏`icon` ו-`apple-touch-icon` עם `icon-192.png`, ורישום של `/sw.js` אחרי טעינת הדף.

### בדיקה מקומית, לפני ה-push
- ה-manifest הוא JSON תקין, ו-`sw.js` עובר בדיקת תחביר.
- כל הקבצים שה-service worker שומר בהתקנה קיימים בתיקייה.
- סימולציה של ה-service worker ב-Node: ‏POST ו-GET ל-/api, ו-Google Fonts, לא נוגעים בהם. עם רשת: הדף מגיע מהרשת. בלי רשת: הדף וה-SVG מגיעים מהמטמון. אין אף כתובת של /api במטמון.
- הדפדפן המובנה באפליקציה של Claude לא מאפשר לרשום service worker, ולכן ההתקנה עצמה נבדקת בכתובת של Vercel ובטלפון.

### תנאי ההשלמה
לפי MILESTONES.md, סעיפים 1 עד 5.
