// Builds a 3-page Hebrew user-guide DOCX for the medic-practice app.
// Pages: (1) Overview + hierarchy  (2) Functionality  (3) Setup & permissions

import { writeFileSync } from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak
} from 'docx';

const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN_V = 900;   // 0.625 inch
const MARGIN_H = 900;
const CONTENT_W = A4_WIDTH - 2 * MARGIN_H; // 10106 DXA

// ============ Style helpers ============
const C_BRAND = "0E7C7B";       // teal
const C_ACCENT = "7C3AED";      // violet
const C_WARM = "F59E0B";        // amber
const C_TEXT = "1F2937";        // gray-800
const C_MUTED = "64748B";       // slate-500
const C_BG_LIGHT = "ECFEFF";    // cyan-50
const C_BG_AMBER = "FEF3C7";    // amber-50
const C_BG_VIOLET = "F3E8FF";   // violet-100
const C_BORDER = "CBD5E1";      // slate-300

const heb = (text, opts = {}) =>
  new TextRun({
    text,
    font: opts.font || "Arial",
    size: opts.size || 20,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color || C_TEXT,
    rightToLeft: true,
    ...(opts.underline ? { underline: {} } : {}),
  });

// Emoji needs its own TextRun WITHOUT rightToLeft so the glyph renders
const emoji = (e, size = 20) =>
  new TextRun({ text: e, font: "Segoe UI Emoji", size });

const p = (content, opts = {}) => {
  const children = Array.isArray(content) ? content : [heb(content, opts)];
  return new Paragraph({
    bidirectional: true,
    alignment: opts.alignment || AlignmentType.RIGHT,
    spacing: opts.spacing || { after: 80, line: 280 },
    pageBreakBefore: opts.pageBreakBefore,
    indent: opts.indent,
    numbering: opts.numbering,
    border: opts.border,
    children,
  });
};

// Headings with emoji + colored title
const h1 = (e, text) =>
  new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 120 },
    children: [
      emoji(e, 44),
      heb("  " + text, { size: 40, bold: true, color: C_BRAND }),
    ],
  });

const h2 = (e, text, color = C_BRAND) =>
  new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { color: color, style: BorderStyle.SINGLE, size: 8, space: 4 },
    },
    children: [
      emoji(e, 26),
      heb("  " + text, { size: 26, bold: true, color }),
    ],
  });

const h3 = (e, text, color = C_BRAND) =>
  new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 120, after: 40 },
    children: [
      emoji(e, 22),
      heb("  " + text, { size: 22, bold: true, color }),
    ],
  });

const bullet = (e, text, secondary) => {
  const kids = [
    emoji(e, 18),
    heb("  " + text, { size: 20, bold: true }),
  ];
  if (secondary) {
    kids.push(heb(" — " + secondary, { size: 18, color: C_MUTED }));
  }
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60, line: 260 },
    indent: { right: 220 },
    children: kids,
  });
};

// Table cell helper
const cell = (paragraphs, opts = {}) => {
  const list = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
    },
    children: list,
  });
};

const tbl = (rows, columnWidths) =>
  new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths,
    rows,
  });

// ============ Content ============
const children = [
  // ===================== PAGE 1 =====================
  h1("🚑", "תרגול חובשים"),
  p(
    [heb("מדריך משתמש מקיף · אפליקציית קורס רפואת חירום", { size: 22, color: C_MUTED, italics: true })],
    { alignment: AlignmentType.CENTER, spacing: { after: 80 } }
  ),
  p(
    [
      emoji("🌐", 18),
      heb("  ", { size: 18 }),
      new TextRun({ text: "https://medic-practice.vercel.app", font: "Arial", size: 22, color: "2563EB", rightToLeft: false }),
    ],
    { alignment: AlignmentType.CENTER, spacing: { after: 240 } }
  ),

  h2("📌", "מה זה?"),
  p("אפליקציית אינטרנט לתרגול קורס חובשי רפואת חירום ונהגי אמבולנס - בעברית מלאה. עובדת בדפדפן במחשב, בטלפון נייד (Android/iOS) ובטאבלט, ללא צורך בהתקנה."),

  h3("✨", "מה כלול?", C_ACCENT),
  bullet("📝", "תרגול שאלות אמריקאיות", "296 שאלות ב-27 נושאים, עם הסבר לכל תשובה"),
  bullet("🎙️", "אנמנזה קולית עם AI", "15 מקרים, 4 שלבים, דו-שיח חי מול Claude AI"),
  bullet("🎯", "מבחן מעורב", "40 שאלות בערבוב: אמריקאיות + אנמנזות + בונוס 50 XP"),
  bullet("🏆", "מערכת משחוק", "רמות, רצפים, 18 הישגים, ולוח דירוג"),
  bullet("📊", "פרופיל אישי", "רמה אדפטיבית, מגמת שיפור, ושליטה לפי נושא"),

  h2("🏗️", "מבנה האפליקציה (היררכי)"),
  tbl(
    [
      // header
      new TableRow({
        tableHeader: true,
        children: [
          cell(p([emoji("🧭", 18), heb("  מסך", { size: 20, bold: true, color: "FFFFFF" })],
              { spacing: { after: 0 }, alignment: AlignmentType.RIGHT }),
              { width: 2400, fill: C_BRAND }),
          cell(p([heb("תוכן עיקרי", { size: 20, bold: true, color: "FFFFFF" })],
              { spacing: { after: 0 } }),
              { width: 5000, fill: C_BRAND }),
          cell(p([heb("פקדים מרכזיים", { size: 20, bold: true, color: "FFFFFF" })],
              { spacing: { after: 0 } }),
              { width: 2706, fill: C_BRAND }),
        ],
      }),
      // Row: Home
      new TableRow({ children: [
        cell(p([emoji("🏠", 18), heb("  דף הבית", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell(p([heb("פרופיל משתמש, רמה, רצף יומי, נושאים חלשים, וכניסה למצבי תרגול", { size: 18 })], { spacing: { after: 0 } }), { width: 5000 }),
        cell(p([emoji("✏️", 16), heb(" עריכת שם · ", { size: 16 }), emoji("🔥", 16), heb(" רצף", { size: 16 })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
      // Row: Quiz
      new TableRow({ children: [
        cell(p([emoji("📝", 18), heb("  אמריקאיות", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell(p([heb("בחירת נושא + כמות שאלות (5/10/20/40). שאלה, 4 אופציות, משוב מיידי, הסבר.", { size: 18 })], { spacing: { after: 0 } }), { width: 5000 }),
        cell(p([emoji("🧠", 16), heb(" מצב אדפטיבי · ", { size: 16 }), emoji("🚀", 16), heb(" התחל", { size: 16 })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
      // Row: Anamnesis
      new TableRow({ children: [
        cell(p([emoji("🎙️", 18), heb("  אנמנזה קולית", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell([
          p([heb("4 שלבים:  ", { size: 18, bold: true })], { spacing: { after: 0 } }),
          p([emoji("🦺", 14), heb(" בטיחות · ", { size: 16 }), emoji("💬", 14), heb(" אנמנזה (עד 10 שאלות) · ", { size: 16 }), emoji("🩺", 14), heb(" אבחנה · ", { size: 16 }), emoji("📋", 14), heb(" משוב", { size: 16 })], { spacing: { after: 0 } })
        ], { width: 5000 }),
        cell(p([emoji("🎤", 16), heb(" מיקרופון · ", { size: 16 }), heb('"תענה לי"', { size: 16, bold: true })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
      // Row: Exam
      new TableRow({ children: [
        cell(p([emoji("🎯", 18), heb("  מבחן מעורב", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell(p([heb("40 שאלות בערבוב: 36 אמריקאיות + 4 אנמנזות. ציון משולב + 50 XP בונוס.", { size: 18 })], { spacing: { after: 0 } }), { width: 5000 }),
        cell(p([emoji("🚀", 16), heb(" התחל מבחן", { size: 16 })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
      // Row: Leaderboard
      new TableRow({ children: [
        cell(p([emoji("🏆", 18), heb("  דשבורד דירוג", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell(p([heb("מיקום ואחוזון מול 30 משתמשי-בנצ׳מרק. זמן השקעה, מגמת שיפור, שליטה בנושאים.", { size: 18 })], { spacing: { after: 0 } }), { width: 5000 }),
        cell(p([emoji("🌐", 16), heb(" שיתוף · טבלת מובילים", { size: 16 })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
      // Row: Stats
      new TableRow({ children: [
        cell(p([emoji("📊", 18), heb("  לוח התקדמות", { size: 20, bold: true })], { spacing: { after: 0 } }), { width: 2400, fill: C_BG_LIGHT }),
        cell(p([heb("רמה ו-XP, דיוק כללי, רצף שיא, הישגים שנפתחו, סטטיסטיקה לפי נושא.", { size: 18 })], { spacing: { after: 0 } }), { width: 5000 }),
        cell(p([emoji("🏅", 16), heb(" 14 הישגים · ", { size: 16 }), emoji("🪜", 16), heb(" סולם רמות", { size: 16 })], { spacing: { after: 0 } }), { width: 2706 }),
      ]}),
    ],
    [2400, 5000, 2706]
  ),

  // ===================== PAGE 2 =====================
  new Paragraph({ children: [new PageBreak()] }),

  h1("⚙️", "מדריך פונקציונליות"),

  h2("📝", "תרגול אמריקאיות"),
  p("נושאים מסומנים בגריד עם אימוג'י וספירת שאלות. בחירת נושא → בחירת כמות → לחצן «🚀 התחל תרגול». במהלך התרגול:"),
  bullet("👆", "לחיצה על תשובה", "צביעה ירוקה (נכון) או אדומה (לא נכון) + הסבר מפורט"),
  bullet("🧠", "תרגול אדפטיבי", "הצ׳קבוקס מפעיל בחירה אוטומטית של שאלות מנושאים שאתם חלשים בהם"),
  bullet("🔥", "רצף תשובות", "כל תשובה נכונה ברצף נותנת בונוס XP גדל"),
  bullet("➡️", "מעבר אוטומטי", "לאחר בחירת תשובה - הופיע כפתור «המשך לשאלה הבאה»"),

  h2("🎙️", "אנמנזה קולית – ארבעת השלבים"),

  h3("🦺", "שלב 1: בטיחות וקליטת קריאה", C_BRAND),
  p("האפליקציה תקריא הודעת מוקד איחוד ההצלה. לחצו על המיקרופון ואמרו בקול: «קיבלתי», «יוצא לקריאה», «ווסט וכפפות», «האם הזירה בטוחה?». ה-checklist מתעדכן בזמן אמת."),

  h3("💬", "שלב 2: דו-שיח עם המטופל (עד 10 שאלות)", C_BRAND),
  p([
    heb("שאלו את המטופל בקול וסיימו במילה ", { size: 20 }),
    heb('"תענה לי"', { size: 20, bold: true, color: C_WARM }),
    heb(". לדוגמה: ", { size: 20 }),
    heb('"מה כואב לך? תענה לי"', { size: 20, italics: true }),
    heb(". המטופל (Claude AI) יענה בעברית מדוברת, יזכור מה כבר נשאל, ולא ימציא פרטים סותרים. מד התקדמות מציג ", { size: 20 }),
    heb("X / 10 שאלות.", { size: 20, bold: true }),
  ]),

  h3("🩺", "שלב 3: בחירת אבחנה מבדלת", C_BRAND),
  p("4 אפשרויות אבחנה מוצגות (א/ב/ג/ד). בחירה → משוב מיידי: צבע ירוק לנכון, אדום ללא-נכון, עם הסבר למה כל תשובה נכונה/שגויה."),

  h3("📋", "שלב 4: משוב מקיף", C_BRAND),
  p("ציון משולב (60% אנמנזה + 25% בטיחות + 15% אבחנה). כולל: רשימת שאלות שכיסיתם, שאלות שחסרו (עם דירוג חשיבות), הערכת סדר לוגי, ושאלות נוספות שיכלתם לשאול."),

  h2("🎯", "מבחן מעורב"),
  p("40 פריטים: 36 שאלות אמריקאיות + 4 אנמנזות בסדר אקראי. ציון משולב בסוף + 50 XP בונוס. סיכום מציג: כמה הצלחת, ציון לכל סוג, וקישור לשאלות שטעית בהן."),

  h2("🏆", "דשבורד הישגים"),
  tbl(
    [
      new TableRow({ children: [
        cell(p([emoji("🥇", 18), heb("  מיקום ואחוזון", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_AMBER }),
        cell(p([heb("«אתה ב-30% המובילים» על בסיס מול 30+ משתמשים", { size: 18 })], { spacing: { after: 0 } }), { width: 7106 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("⏱️", 18), heb("  זמן השקעה", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_AMBER }),
        cell(p([heb("סך כל זמן הלימוד + מספר ימי תרגול פעילים", { size: 18 })], { spacing: { after: 0 } }), { width: 7106 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("📈", 18), heb("  מגמת התקדמות", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_AMBER }),
        cell(p([heb("השוואת 3 מבחנים אחרונים מול 3 שקודמים: משתפר / יציב / יורד", { size: 18 })], { spacing: { after: 0 } }), { width: 7106 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("📚", 18), heb("  שליטה בנושאים", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_AMBER }),
        cell(p([heb("פס לכל נושא: 🟢 חזק (>75%) / 🟡 מתפתח (50-75%) / 🔴 חלש (<50%)", { size: 18 })], { spacing: { after: 0 } }), { width: 7106 }),
      ]}),
    ],
    [3000, 7106]
  ),

  // ===================== PAGE 3 =====================
  new Paragraph({ children: [new PageBreak()] }),

  h1("🔐", "הרשאות והכנת המכשיר"),

  h2("📱", "טלפון נייד", C_BRAND),

  h3("🍎", "iPhone / iPad - 4 שלבים", C_ACCENT),
  p([heb("1. ", { size: 20, bold: true }), heb("הגדרות (Settings) → נגישות (Accessibility) → תוכן מדובר (Spoken Content) → קולות (Voices) → עברית → הורד קול («Carmit»).", { size: 20 })]),
  p([heb("2. ", { size: 20, bold: true }), heb("פתחו את Safari → היכנסו ל-", { size: 20 }), new TextRun({ text: "medic-practice.vercel.app", font: "Arial", size: 20, color: "2563EB", rightToLeft: false }), heb(" → אשרו הרשאת מיקרופון בלחיצה הראשונה.", { size: 20 })]),
  p([heb("3. ", { size: 20, bold: true }), heb("המלצה: הוסיפו את האפליקציה למסך הבית: «שתף → Add to Home Screen». כך היא תיפתח במסך מלא.", { size: 20 })]),
  p([heb("4. ", { size: 20, bold: true }), heb("בדפדפן Chrome ב-iOS אין תמיכה ב-Web Speech - השתמשו אך ורק ב-Safari.", { size: 20, color: "B91C1C" })]),

  h3("🤖", "Android - 4 שלבים", C_ACCENT),
  p([heb("1. ", { size: 20, bold: true }), heb("הגדרות (Settings) → נגישות (Accessibility) → הפקת טקסט לדיבור (Text-to-Speech output) → ⚙️ ליד «Google TTS» → התקן נתוני קול (Install voice data) → עברית.", { size: 20 })]),
  p([heb("2. ", { size: 20, bold: true }), heb("פתחו את Chrome → היכנסו לכתובת → אשרו הרשאת מיקרופון.", { size: 20 })]),
  p([heb("3. ", { size: 20, bold: true }), heb("Chrome → ⋮ → Add to Home screen → גרסה מלאת מסך כמו אפליקציה.", { size: 20 })]),
  p([heb("4. ", { size: 20, bold: true }), heb("מומלץ להשתמש באוזניות עם מיקרופון לדיוק טוב יותר בזיהוי קולי.", { size: 20 })]),

  h2("💻", "מחשב (Windows / Mac)", C_BRAND),
  p([heb("דפדפן מומלץ: ", { size: 20 }), heb("Chrome 90+, Edge 90+, Safari 14+", { size: 20, bold: true }), heb(". Firefox - תמיכה חלקית בזיהוי קולי.", { size: 20 })]),
  p([heb("Windows: ", { size: 20, bold: true }), heb("הגדרות → זמן ושפה → דיבור → הוסף קולות → Hebrew. בדקו שהמיקרופון מאופשר ב: הגדרות → פרטיות → מיקרופון.", { size: 20 })]),
  p([heb("Mac: ", { size: 20, bold: true }), heb("System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Hebrew. + בדקו: Privacy & Security → Microphone.", { size: 20 })]),

  h2("✅", "סיכום הרשאות נדרשות", C_BRAND),
  tbl(
    [
      new TableRow({
        tableHeader: true,
        children: [
          cell(p([heb("הרשאה", { size: 20, bold: true, color: "FFFFFF" })], { spacing: { after: 0 } }), { width: 3000, fill: C_BRAND }),
          cell(p([heb("חובה / רשות", { size: 20, bold: true, color: "FFFFFF" })], { spacing: { after: 0 } }), { width: 2500, fill: C_BRAND }),
          cell(p([heb("מטרה", { size: 20, bold: true, color: "FFFFFF" })], { spacing: { after: 0 } }), { width: 4606, fill: C_BRAND }),
        ],
      }),
      new TableRow({ children: [
        cell(p([emoji("🎤", 16), heb("  מיקרופון", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_VIOLET }),
        cell(p([heb("חובה", { size: 18, bold: true, color: "B91C1C" })], { spacing: { after: 0 } }), { width: 2500 }),
        cell(p([heb("הקלטת שאלות במצב אנמנזה", { size: 18 })], { spacing: { after: 0 } }), { width: 4606 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("🔊", 16), heb("  קול עברי TTS", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_VIOLET }),
        cell(p([heb("מומלץ", { size: 18, bold: true, color: C_WARM })], { spacing: { after: 0 } }), { width: 2500 }),
        cell(p([heb("הקראת התסריט והתשובות של המטופל בעברית", { size: 18 })], { spacing: { after: 0 } }), { width: 4606 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("📡", 16), heb("  חיבור אינטרנט", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_VIOLET }),
        cell(p([heb("חובה", { size: 18, bold: true, color: "B91C1C" })], { spacing: { after: 0 } }), { width: 2500 }),
        cell(p([heb("קריאה ל-Claude AI עבור משוב ודיאלוג", { size: 18 })], { spacing: { after: 0 } }), { width: 4606 }),
      ]}),
      new TableRow({ children: [
        cell(p([emoji("💾", 16), heb("  אחסון מקומי", { size: 18, bold: true })], { spacing: { after: 0 } }), { width: 3000, fill: C_BG_VIOLET }),
        cell(p([heb("אוטומטי", { size: 18, bold: true, color: C_MUTED })], { spacing: { after: 0 } }), { width: 2500 }),
        cell(p([heb("שמירת התקדמות, רמה, הישגים, פרופיל אישי", { size: 18 })], { spacing: { after: 0 } }), { width: 4606 }),
      ]}),
    ],
    [3000, 2500, 4606]
  ),

  h2("💡", "טיפים לעבודה אופטימלית", C_BRAND),
  bullet("🎧", "השתמשו באוזניות עם מיקרופון", "מקטין רעשי רקע ומשפר זיהוי דיבור"),
  bullet("🌐", "Wi-Fi יציב", "תגובת AI דורשת 1-3 שניות לכל שאלה"),
  bullet("📚", "התחילו עם שאלות אמריקאיות", "לפני שעוברים לאנמנזה הקולית"),
  bullet("⏱️", "מבחן מעורב = ~40 דקות", "הקצו זמן ללא הפרעות"),
  bullet("🔄", "אם רואים «Failed to fetch»", "לחיצה על «🔄 נסה שוב» או חזרו לאחור"),
  bullet("🆘", "בטיחות לפני הכל", "האפליקציה היא לתרגול בלבד - לא תחליף לשטח אמיתי"),

  // Footer
  p([
    heb("מסמך זה נכתב עבור גרסת המערכת מ-מאי 2026. עדכונים: ", { size: 16, color: C_MUTED, italics: true }),
    new TextRun({ text: "https://medic-practice.vercel.app", font: "Arial", size: 16, color: "2563EB", rightToLeft: false }),
  ], { alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
];

// ============ Build ============
const doc = new Document({
  creator: "Medic Practice App",
  title: "מדריך משתמש - תרגול חובשים",
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: A4_WIDTH, height: A4_HEIGHT },
        margin: { top: MARGIN_V, right: MARGIN_H, bottom: MARGIN_V, left: MARGIN_H },
      },
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
const outPath = "מדריך-משתמש-תרגול-חובשים.docx";
writeFileSync(outPath, buffer);
console.log(`Created: ${outPath} (${buffer.length} bytes)`);
