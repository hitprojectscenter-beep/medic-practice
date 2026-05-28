# 🚑 תרגול חובשים

אפליקציית תרגול אינטראקטיבית לקורס חובשי רפואת חירום ונהגי אמבולנס. תמיכה מלאה בעברית, מותאמת למחשב נייד וטלפון (Android + iOS).

## ✨ תכונות

- **שאלות בחירה מרובה (~100 שאלות)** מאורגנות לפי 20 נושאים, עם הסברים ואפשרות לחשוף תשובה.
- **אנמנזה קולית (15 מקרים)**: האפליקציה מקריאה מקרה בעברית, הנבחן עונה בקול והמערכת נותנת משוב.
- **מבחן מעורב**: 40 פריטים אקראיים (~36 אמריקאיות + 4 אנמנזות), עם ציון משולב וסיכום.
- **זיהוי דיבור עברי** דרך Web Speech API של הדפדפן + נפילה לאופציונלית ל-OpenAI Whisper לדיוק גבוה יותר.
- **משוב חכם על אנמנזה** באמצעות Anthropic Claude API. בהיעדר מפתח - חזרה אוטומטית למשוב heuristic מבוסס keywords.
- **RTL מלא**, פונט Heebo, ועיצוב מותאם מובייל ודסקטופ.

## 🚀 הרצה לוקאלית

```bash
npm install
cp .env.example .env.local
# ערכו את .env.local והוסיפו את המפתחות שלכם
npm run dev
```

האפליקציה תיפתח ב-http://localhost:3000.

## 🔑 משתני סביבה

| משתנה | חובה? | תיאור |
|--------|--------|--------|
| `ANTHROPIC_API_KEY` | מומלץ | מפתח Anthropic Claude למשוב חכם על אנמנזה. בלעדיו - משוב heuristic |
| `OPENAI_API_KEY` | אופציונלי | מפתח OpenAI לזיהוי דיבור עברי איכותי (Whisper). בלעדיו - Web Speech בלבד |

## 🌐 דפדפנים נתמכים

- **Chrome / Edge** (כל פלטפורמה): תמיכה מלאה ב-Web Speech (TTS + STT עברית)
- **Safari iOS**: TTS עברית, **אין** Web Speech STT - דרוש Whisper API
- **Firefox**: TTS עברית, STT דורש Whisper API
- **Android Chrome**: תמיכה מלאה

## 📦 פריסה ל-Vercel

```bash
vercel --prod
```

קבעו את משתני הסביבה ב-Vercel Dashboard:
- Settings → Environment Variables
- הוסיפו `ANTHROPIC_API_KEY` ובחירה `OPENAI_API_KEY`

## 🏗 ארכיטקטורה

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Web Speech API** (לקוח) ל-TTS ו-STT
- **OpenAI Whisper** (שרת) כ-fallback ל-STT
- **Anthropic Claude API** (שרת) למשוב על אנמנזה
- ללא DB - כל הנתונים סטטיים ב-`/data`

## 📁 מבנה תיקיות

```
medic-app/
├── app/
│   ├── api/
│   │   ├── feedback/route.ts     # משוב על אנמנזה (Claude + fallback)
│   │   └── transcribe/route.ts   # תמלול אודיו (Whisper)
│   ├── exam/page.tsx             # מבחן מעורב 40 שאלות
│   ├── practice/
│   │   ├── quiz/page.tsx         # תרגול בחירה מרובה
│   │   └── anamnesis/page.tsx    # תרגול אנמנזה קולית
│   ├── layout.tsx                # RTL + פונט עברי
│   └── page.tsx                  # דף הבית
├── components/
│   ├── AnamnesisCard.tsx
│   ├── Mic.tsx
│   ├── QuizCard.tsx
│   └── Speak.tsx
├── data/
│   ├── cases.ts                  # 15 מקרי אנמנזה עם רכיבים צפויים
│   └── questions.ts              # ~100 שאלות אמריקאיות
└── lib/
    └── speech.ts                 # Wrapper ל-Web Speech + Whisper
```

## 🔒 פרטיות

- אין שמירת נתוני משתמש בשרת או DB.
- הקלטות אודיו נשלחות ל-Whisper רק אם הוגדר המפתח, ואז נמחקות.
- תמלולים נשלחים ל-Claude רק לקבלת משוב.

## ⚠️ הצהרה רפואית

האפליקציה היא כלי תרגול חינוכי בלבד. **אינה תחליף לאימון בשטח, להדרכה רשמית או לשיקול קליני**. השאלות והמקרים מבוססים על חומר לימוד כללי לקורסי חובשים, ועלולים שלא להלום פרוטוקולים מעודכנים בכל ארגון.

## רישיון

לשימוש פנימי, חינוכי בלבד.
