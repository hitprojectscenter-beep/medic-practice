# תרגול חובשים | Medic Practice

> אפליקציית תרגול בעברית לחניכי קורס חובשים ונהגי אמבולנס — שאלות אמריקאיות, אנמנזה קולית מול מטופל שמדבר איתך, תרחישי שטח PHTLS מלאים ודשבורד ניהול.

**Live:** https://medic-practice.vercel.app
**Admin:** https://medic-practice.vercel.app/admin

<div align="right" dir="rtl">

פותח לטובת חניכי קורס חובשים ונהגי אמבולנס של איחוד ההצלה, קבוצת שער הנגב. כלל השאלות נוצרו ע"י AI ונבדקו במהלך הכנה למבחן. בהודעה על טעות: מארק ישראל · 050-571-4100.

</div>

---

## תכולה

| מודול | כמות | תיאור |
|---|---:|---|
| שאלות אמריקאיות | **340** | ב-33 נושאים של הקורס, עם הסבר לכל תשובה + רמה אדפטיבית |
| מקרי אנמנזה קולית | **55** | האפליקציה מקריאה קריאת מוקד; אתם עונים בקול; AI נותן משוב |
| תרחישי שטח (PHTLS) | **34** | 7 שלבים מקליטת קריאה → הגעה → XABCDE → מדדים → שיחה → טיפול → פינוי |
| מבחן מעורב | 40 שאלות | 36 אמריקאיות + 4 אנמנזות בערבוב אקראי, ציון משולב + XP בונוס |
| משחק רבעי הבטן | 1 | גרירת איברים לרביע הנכון על איור אנטומי, דירוג כוכבים |
| דשבורד + לוח דירוג | 1 | מיקום מול אחרים, מגמת התקדמות, זמן השקעה, שליטה לפי נושא |
| דשבורד ניהול `/admin` | 1 | KPIs, גרף 14 יום, funnel תרחישים, דיוק לפי נושא |

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19
- **Styling:** Tailwind CSS 3 + inline CSS-in-JS
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`) — משוב אנמנזה + דיאלוג מטופל + משוב תרחיש
- **Voice:** Web Speech API (TTS: `he-IL` `Carmit` / Google TTS · STT: browser-native)
- **Persistence:** Vercel KV (Upstash Redis) עם fallback לזיכרון לפיתוח מקומי
- **Analytics:** Vercel Analytics + custom event tracking
- **Deployment:** Vercel
- **RTL:** Native Hebrew throughout

## מבנה הפרויקט

```
medic-app/
├── app/
│   ├── page.tsx                    # דף הבית — hub לכל המודולים
│   ├── layout.tsx                  # Root layout + Analytics + VisitTracker
│   ├── welcome/                    # דף כניסה ראשונה (marketing landing)
│   ├── admin/                      # דשבורד ניהול (מוגן ADMIN_PASSWORD)
│   ├── practice/
│   │   ├── quiz/                   # שאלות אמריקאיות (רגיל / לפי נושא)
│   │   ├── anamnesis/              # אנמנזה קולית עם AI
│   │   └── scenario/               # תרחיש שטח PHTLS 7 שלבים
│   ├── exam/                       # מבחן מעורב 40 שאלות
│   ├── games/abdomen/              # משחק גרירת רבעי הבטן
│   ├── leaderboard/                # לוח דירוג משתמשים
│   ├── stats/                      # סטטיסטיקות אישיות
│   ├── _track/VisitTracker.tsx     # רישום ביקורים אוטומטי
│   └── api/
│       ├── track/                  # קליטת events מהקליינט
│       ├── admin/stats/            # אגרגציה למסך ניהול (מוגן)
│       ├── dialogue/               # דיאלוג AI עם מטופל (אנמנזה)
│       ├── feedback/               # משוב AI על אנמנזה
│       ├── scenario-feedback/      # משוב AI על תרחיש
│       ├── transcribe/             # STT fallback
│       └── leaderboard/            # לוח דירוג (in-memory)
├── components/
│   ├── QuizCard.tsx                # קלף שאלה אמריקאית
│   ├── AnamnesisCard.tsx           # לב האנמנזה — 4 שלבים
│   ├── ScenarioCard.tsx            # תרחיש 7 שלבים (dispatch → transport)
│   ├── Mic.tsx                     # רכיב מיקרופון + STT
│   ├── Speak.tsx                   # רכיב TTS
│   ├── StatsBar.tsx                # פס סטטיסטיקות עליון
│   ├── Celebration.tsx             # אנימציית חגיגה
│   └── AchievementToast.tsx        # התראת הישג
├── data/
│   ├── questions.ts                # 340 שאלות אמריקאיות
│   ├── cases.ts                    # 55 מקרי אנמנזה
│   ├── case-extras.ts              # הרחבות (dispatcher intro וכו')
│   └── scenarios.ts                # 34 תרחישי PHTLS
├── lib/
│   ├── kv.ts                       # KV wrapper עם in-memory fallback
│   ├── track.ts                    # client-side event tracker
│   ├── speech.ts                   # TTS/STT helpers
│   ├── userProfile.ts              # פרופיל משתמש (localStorage)
│   └── gamification.ts             # emoji לפי streak/ציון
└── hooks/
    └── useGameStats.ts             # hook סטטיסטיקות משחק
```

## הרצה מקומית

```bash
git clone https://github.com/hitprojectscenter-beep/medic-practice.git
cd medic-practice
npm install

# צור .env.local עם:
# ANTHROPIC_API_KEY=sk-ant-...        # חובה
# ADMIN_PASSWORD=your-strong-pw       # אופציונלי, ברירת מחדל admin1234
# KV_REST_API_URL=...                 # אופציונלי (fallback לזיכרון)
# KV_REST_API_TOKEN=...

npm run dev   # http://localhost:3000
```

## Environment Variables

| שם | חובה? | תפקיד |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | AI — דיאלוג מטופל, משוב אנמנזה, משוב תרחיש |
| `ADMIN_PASSWORD` | ⚠️ | סיסמת גישה ל-`/admin`. ברירת מחדל `admin1234` — **חובה לשנות** |
| `KV_REST_API_URL` | ⏳ | Vercel KV — סטטיסטיקות פרסיסטנטיות |
| `KV_REST_API_TOKEN` | ⏳ | טוקן ל-KV — נוצר אוטומטית ב-Connect Project |

ללא KV — הסטטיסטיקות שומרות בזיכרון של השרת ונמחקות ב-cold start.

## דשבורד `/admin`

### KPIs (עליונים)
- 👥 משתמשים ייחודיים סה"כ
- 🚪 כניסות היום + משתמשים ייחודיים היום
- 📝 שאלות שנענו (14 יום) + דיוק כללי
- 🎯 ציון ממוצע במבחן + כמות מבחנים שהושלמו
- 🎙️ אנמנזות שהושלמו (14 יום)
- 🚨 שיעור השלמת תרחישים (funnel start→complete)

### גרפים וטבלאות
- **גרף 14 יום** — כניסות יומיות
- **טבלת נושאים** — שאלות שנענו, נכונות, דיוק % (צבעי אזהרה)
- **טבלת תרחישים** — התחלות, השלמות, שיעור השלמה
- **רשת אנמנזה** — כמה השלימו כל מקרה

### Auth
Session-only — הסיסמה נשמרת ב-`sessionStorage` לזמן הכניסה, לא נרשמת בשרת.

## Events נרשמים

| event | היכן נורה |
|---|---|
| `visit` | Root layout — פעם אחת ל-30 דקות (session-based dedup) |
| `question_answered` | `app/practice/quiz/page.tsx` — לכל שאלה + topic + correct |
| `anamnesis_completed` | `app/practice/anamnesis/page.tsx` — לכל מקרה שהושלם + score |
| `scenario_started` | `app/practice/scenario/page.tsx` — בלחיצה על תרחיש |
| `scenario_completed` | `app/practice/scenario/page.tsx` — בסיום כל 7 שלבים |
| `exam_completed` | `app/exam/page.tsx` — בסיום 40 שאלות + score |

Client-side tracker ב-[`lib/track.ts`](lib/track.ts) — fire-and-forget עם `keepalive: true` כדי לשרוד ניווט מהיר.

## Deploy

```bash
npx vercel --prod --yes
```

Vercel זיהתה אוטומטית את Next.js. הפרויקט מקושר ל-Project `medic-practice` תחת Team `hitprojectscenter-6566s-projects`.

## Credits

- **פיתוח וליווי:** מארק ישראל — 050-571-4100
- **נמענים:** חניכי קורס חובשים ונהגי אמבולנס, איחוד ההצלה שער הנגב
- **AI Backend:** Anthropic Claude

## License

Educational / community project. אין רישוי מסחרי — בשימוש חופשי לצרכי הכשרת חובשים.
