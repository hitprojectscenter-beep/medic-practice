// Full PHTLS scenario data - "מקרים ותגובות" module.
// Each scenario walks through 7 phases: dispatch → scene safety → primary survey
// → vitals → patient dialogue → treatment → transport decision.

export type Scenario = {
  id: string;
  title: string;
  topic: string;
  difficulty: 1 | 2 | 3; // 1=easy, 3=hard
  emoji: string;

  // Phase 1: Dispatch call
  dispatch: {
    text: string;              // Spoken by dispatcher (TTS)
    acceptKeywords: string[];  // User should say one of these to acknowledge
  };

  // Phase 2: Scene arrival + safety
  scene: {
    description: string;       // What you see on arrival (TTS)
    hazards: string[];         // Hazards present
    safetyChecklist: {
      label: string;
      keywords: string[];      // Things user should say
      critical: boolean;
    }[];
  };

  // Phase 3: Primary survey XABCDE
  // Each step: user announces what they check, app reveals finding
  primary: {
    x: { check: string; keywords: string[]; finding: string; criticalAction?: string };
    a: { check: string; keywords: string[]; finding: string; criticalAction?: string };
    b: { check: string; keywords: string[]; finding: string; criticalAction?: string };
    c: { check: string; keywords: string[]; finding: string; criticalAction?: string };
    d: { check: string; keywords: string[]; finding: string; criticalAction?: string };
    e: { check: string; keywords: string[]; finding: string; criticalAction?: string };
  };

  // Phase 4: Vitals
  vitals: {
    name: string;          // What to ask for
    keywords: string[];    // Keywords user might say
    value: string;         // What you tell them
    abnormal?: boolean;    // Marker for abnormal value
  }[];

  // Phase 5: Patient dialogue (reused from anamnesis pattern)
  patientResponses: { keywords: string[]; answer: string }[];

  // Phase 6: Treatments
  treatments: {
    correct: { name: string; keywords: string[]; rationale: string }[];
    contraindicated: { name: string; keywords: string[]; reason: string }[];
  };

  // Phase 7: Transport
  transport: {
    options: { label: string; correct: boolean; explanation: string }[];
  };

  // Reference model
  modelResponse: string;
};

export const scenarios: Scenario[] = [
  // ============ 1. MVC TRAUMA ============
  {
    id: "scenario-mvc",
    title: "תאונת דרכים - נהג רכב",
    topic: "טראומה",
    difficulty: 2,
    emoji: "🚗",

    dispatch: {
      text: "מוקד לכוננים. תאונת דרכים בכביש 4 צומת חולון, מכונית פגעה בעמוד. נהג יחיד לכוד ברכב. חוסר הכרה לפי דיווח עוברים. אמבולנס נוסף ומכבי אש בדרך. עליכם להגיע ראשונים.",
      acceptKeywords: ["קיבלתי", "מקבל", "יוצא לקריאה", "בדרך", "מאשר"]
    },

    scene: {
      description: "אתם מגיעים. רכב פרטי שטוח על עמוד חשמל. נהג זכר בערך גיל 35, חגור בחגורה, האיירבג פתוח. עוברי דרך מסביב מנסים לעזור. אין אש או דליפת דלק נראית. תנועה זורמת בכביש לידכם.",
      hazards: ["תנועה זורמת", "עמוד חשמל", "אפשרות לדליפת דלק", "עוברים בזירה"],
      safetyChecklist: [
        { label: "ציוד מגן אישי - ווסט, כפפות", keywords: ["ווסט", "כפפות", "ציוד מגן", "PPE"], critical: true },
        { label: "הערכת בטיחות זירה", keywords: ["בטוח", "בטיחות", "סכנות", "האם בטוח"], critical: true },
        { label: "סימון אזור / חסימת תנועה", keywords: ["תנועה", "חסימה", "אזור בטוח"], critical: false },
        { label: "ספירת נפגעים", keywords: ["נפגעים", "כמה", "ספירה"], critical: true },
        { label: "דיווח הגעה למוקד", keywords: ["הגעה", "הגענו", "במקום"], critical: true }
      ]
    },

    primary: {
      x: { check: "דימום מסיבי גלוי", keywords: ["דימום", "X", "Exsanguinating", "דם"], finding: "אין דימום חיצוני משמעותי על פני הגוף או הרצפה." },
      a: { check: "נתיב אוויר עם קיבוע צוואר", keywords: ["נתיב אוויר", "Airway", "צוואר", "C-spine", "קיבוע"], finding: "נתיב אוויר פתוח, נושם ספונטני. הצוואר מקובע ידנית.", criticalAction: "קיבוע צוואר ידני!" },
      b: { check: "נשימה - תדירות, סימטריה, עומק", keywords: ["נשימה", "Breathing", "נושם", "סימטרי"], finding: "נשימות 26 לדקה, סימטריות, ללא רעשים. סטורציה 94%." },
      c: { check: "מחזור דם - דופק, עור, דימומים", keywords: ["דופק", "Circulation", "מחזור", "עור", "מילוי קפילרי"], finding: "דופק 120 מהיר אך תקין. עור חיוור וקר. CRT 3 שניות. אין דימום פנימי שנראה." },
      d: { check: "רמת הכרה - AVPU או GCS", keywords: ["הכרה", "AVPU", "GCS", "מגיב"], finding: "AVPU = V (מגיב לקול). אישונים שווים תגובה לאור. סוכר 100." },
      e: { check: "חשיפה ובדיקה מלאה + שמירה מקור", keywords: ["חשיפה", "Exposure", "חשיפת"], finding: "חבלת ראש קלה במצח. כאב באגן. רגל ימין נראית מעוותת. שמרנו על חום." }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP", "סיסטולי"], value: "100/70", abnormal: true },
      { name: "דופק", keywords: ["דופק", "Pulse", "HR"], value: "120 לדקה, סדיר אך מהיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR", "תדירות נשימה"], value: "26 לדקה, סימטריות", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2", "חמצן"], value: "94% באוויר חדר", abnormal: true },
      { name: "סוכר", keywords: ["סוכר", "גלוקוז", "BGL"], value: "100" },
      { name: "אישונים", keywords: ["אישונים", "PERRLA", "פאפילרי"], value: "שווים, מגיבים לאור, 3 מ\"מ" },
      { name: "טמפרטורה", keywords: ["טמפרטורה", "חום"], value: "36.4 (קל-נמוך)" }
    ],

    patientResponses: [
      { keywords: ["שם", "איך קוראים"], answer: "...שמי אדם." },
      { keywords: ["מה כואב", "כואב לך", "כאב"], answer: "...האגן. נורא כואב. וגם הראש." },
      { keywords: ["מה קרה", "תאונה", "זוכר"], answer: "...לא זוכר בדיוק. הסתחררתי, ואז הכל שחור." },
      { keywords: ["סוכרת", "מחלות"], answer: "אין לי מחלות." },
      { keywords: ["תרופות", "מה לוקח"], answer: "כלום קבוע." },
      { keywords: ["אלרגיה", "רגיש"], answer: "אין לי אלרגיות." }
    ],

    treatments: {
      correct: [
        { name: "קיבוע צוואר ידני + צווארון", keywords: ["צווארון", "C-collar", "קיבוע", "ידני"], rationale: "מנגנון של תאונת רכב = חשד קבוע לפגיעת C-spine" },
        { name: "חמצן 15 ליטר עם מסכה", keywords: ["חמצן", "15 ליטר", "מסכה"], rationale: "סטורציה 94% + טראומה = חמצן גבוה" },
        { name: "ניטור רציף ומדדים חוזרים", keywords: ["ניטור", "מדדים חוזרים", "ניטור רציף"], rationale: "מטופל לא יציב - הערכה חוזרת כל 5 דקות" },
        { name: "פינוי על מזרן/ספיינל בורד", keywords: ["מזרן", "ספיינל בורד", "Backboard", "אלונקה"], rationale: "קיבוע מלא לפינוי" },
        { name: "שמירה על חום הגוף", keywords: ["שמיכה", "חום", "היפותרמיה"], rationale: "טראומה = סיכון להיפותרמיה" }
      ],
      contraindicated: [
        { name: "הוצאה מהיר ללא קיבוע", keywords: ["הוצאה מהיר", "ללא קיבוע"], reason: "פגיעת C-spine אפשרית - אסור להזיז ללא קיבוע" },
        { name: "הזרקת מורפיום ע\"י חובש", keywords: ["מורפיום", "אופייטים"], reason: "מחוץ לסמכות חובש; ALS בלבד" },
        { name: "הסרת קסדה לא נדרשת", keywords: ["הסרת קסדה"], reason: "לא רלוונטי (נהג רכב, לא רוכב)" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) לחדר טראומה בית חולים שלישוני", correct: true, explanation: "מטופל לא יציב + חשד פוליטראומה + ירידה ברמת הכרה = ALS דחוף לטראומה שלישונית. זמן קריטי." },
        { label: "BLS רגיל (קוד 1) לחדר מיון הקרוב ביותר", correct: false, explanation: "המטופל לא יציב - BLS לא מספיק. צריך ALS עם יכולת התערבות מתקדמת בדרך." },
        { label: "המתנה ל-ALS במקום עד שיגיעו", correct: false, explanation: "אסור לעכב פינוי. Time is critical בטראומה - 'Golden Hour'. פגישה בדרך עם ALS אם אפשר." },
        { label: "פינוי במכונית פרטית של עובר אורח", correct: false, explanation: "מסכן את החיים. מטופל טראומה דורש קיבוע מלא, חמצן וניטור - רק אמבולנס." }
      ]
    },

    modelResponse: "1. קליטה: 'קיבלתי, יוצא לקריאה'. 2. הגעה: ווסט, כפפות, הערכת בטיחות (תנועה, חשמל, דלק), דיווח הגעה למוקד. 3. גישה: קיבוע צוואר ידני מיד! XABCDE - אין דימום, נתיב פתוח, נשימה 26 + סטורציה 94% → חמצן 15ל/דק', דופק 120 + עור חיוור → ALS. AVPU=V. חשיפה - חבלה אגן ורגל. 4. מדדים: ל\"ד 100/70, דופק 120, RR 26, SpO2 94%. 5. שיחה - לא זוכר, כאב באגן וראש. 6. טיפול: צווארון, חמצן, אלונקה, שמיכה, ניטור רציף. 7. פינוי ALS קוד 3 לטראומה שלישונית."
  },

  // ============ 2. ACS - CHEST PAIN ============
  {
    id: "scenario-acs",
    title: "כאב חזה במבוגר בבית",
    topic: "לב וכלי דם",
    difficulty: 2,
    emoji: "💔",

    dispatch: {
      text: "מוקד לכוננים. גבר בן 62, רחוב הרצל 25 קומה 3, כאב חזה חזק מאז 30 דקות. רעייתו במקום ופתחה את הדלת. סטטוס לבבי. קרוב לבית חולים.",
      acceptKeywords: ["קיבלתי", "מקבל", "יוצא לקריאה", "בדרך", "מאשר"]
    },

    scene: {
      description: "אישה נחושה פותחת לכם את הדלת. הבעל יושב על הספה בסלון, מחזיק את החזה. מזיע ורועד. אין מטרדים בזירה, דירה רגילה. הוא ער ומדבר במשפטים קצרים.",
      hazards: ["מדרגות (קומה 3)", "אין מטרדי בטיחות מיוחדים"],
      safetyChecklist: [
        { label: "ציוד מגן אישי - ווסט, כפפות", keywords: ["ווסט", "כפפות", "ציוד מגן"], critical: true },
        { label: "הערכת בטיחות זירה", keywords: ["בטוח", "בטיחות"], critical: true },
        { label: "דיווח הגעה למוקד", keywords: ["הגעה", "במקום", "הגענו"], critical: true },
        { label: "בקשת ALS לפי תסמינים", keywords: ["ALS", "ניידת נמרץ", "פראמדיק"], critical: true }
      ]
    },

    primary: {
      x: { check: "דימום מסיבי גלוי", keywords: ["דימום", "X", "Exsanguinating"], finding: "אין דימום." },
      a: { check: "נתיב אוויר", keywords: ["נתיב אוויר", "Airway"], finding: "נתיב אוויר פתוח, מדבר אם כי בקושי." },
      b: { check: "נשימה", keywords: ["נשימה", "Breathing", "נושם"], finding: "נשימות 24, מעט מאומצות. סטורציה 93%." },
      c: { check: "מחזור דם", keywords: ["דופק", "Circulation", "עור"], finding: "דופק 105 סדיר, חזק. עור חיוור ומזיע. CRT 2 שניות." },
      d: { check: "רמת הכרה", keywords: ["הכרה", "AVPU", "GCS"], finding: "Alert, מתמצא במקום וזמן. סוכר 110." },
      e: { check: "חשיפה - כאב, סימנים נוספים", keywords: ["חשיפה", "Exposure"], finding: "אין סימני טראומה. הוא מצביע על המרכז של החזה, כאב מקרין לזרוע שמאל." }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "150/95", abnormal: true },
      { name: "דופק", keywords: ["דופק", "Pulse", "HR"], value: "105 סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "24 לדקה", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "93%", abnormal: true },
      { name: "סוכר", keywords: ["סוכר", "גלוקוז"], value: "110" },
      { name: "טמפרטורה", keywords: ["טמפרטורה", "חום"], value: "36.8" }
    ],

    patientResponses: [
      { keywords: ["מה כואב", "איפה כואב"], answer: "באמצע החזה, לוחץ חזק. מקרין לי ליד שמאל." },
      { keywords: ["מתי התחיל", "כמה זמן"], answer: "לפני 30 דקות. הייתי קם מהספה לעבור לחדר." },
      { keywords: ["מאפיין", "איך מרגיש"], answer: "כמו פיל יושב לי על החזה. לוחץ ושורף." },
      { keywords: ["סוכרת", "מחלות"], answer: "כן, סוכרתי. ויש לי לחץ דם גבוה." },
      { keywords: ["תרופות"], answer: "מטפורמין, רמיפריל, סטטין." },
      { keywords: ["אלרגיה"], answer: "אין אלרגיות שאני יודע." },
      { keywords: ["אספירין", "מדללי דם"], answer: "לא לוקח אספירין באופן קבוע." },
      { keywords: ["מעשן"], answer: "מעשן 30 שנה, חבילה ביום." },
      { keywords: ["אוטם", "צנתור"], answer: "לא, אף פעם." }
    ],

    treatments: {
      correct: [
        { name: "אספירין 250-300 מ\"ג ללעיסה", keywords: ["אספירין", "250", "300", "ללעיסה"], rationale: "אנטי-טסיות בחשד ACS - אם אין אלרגיה" },
        { name: "חמצן לפי סטורציה", keywords: ["חמצן", "סטורציה"], rationale: "סטורציה 93% - חמצן ל-94%+" },
        { name: "ניטרוגליצרין תת-לשוני (לפי הוראה)", keywords: ["ניטרו", "ניטרוגליצרין"], rationale: "מרחיב כלי דם - לפי פרוטוקול ובמדדים תקינים" },
        { name: "תנוחה: חצי-ישיבה נוחה", keywords: ["תנוחה", "חצי ישיבה", "ישיבה"], rationale: "מקטין עומס לבבי" },
        { name: "ניטור EKG / מד סטורציה", keywords: ["ניטור", "EKG", "אקג", "מדדים"], rationale: "זיהוי הפרעות קצב" }
      ],
      contraindicated: [
        { name: "אספירין למרות אלרגיה", keywords: ["אספירין אלרגי"], reason: "אם יש אלרגיה - לא לתת" },
        { name: "מים או אוכל לפני הפינוי", keywords: ["מים", "אוכל", "שתייה"], reason: "NPO לקראת אפשרות צנתור" },
        { name: "מורפיום ע\"י חובש", keywords: ["מורפיום"], reason: "מחוץ לסמכות חובש" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) לחדר צנתורים", correct: true, explanation: "חשד ACS חי = ALS דחוף ישירות לחדר צנתורים (לא דרך מיון). Door-to-Balloon < 90 דק'!" },
        { label: "BLS רגיל למיון הקרוב", correct: false, explanation: "STEMI דורש צנתור - לא להתעכב במיון רגיל. ALS עם EKG בדרך + טלפון לחדר צנתורים." },
        { label: "המתנה לראיות EKG ברורות", correct: false, explanation: "כאב חזה לבבי טיפוסי + גורמי סיכון = ALS מיד. EKG בדרך." },
        { label: "פינוי במכונית פרטית של רעייתו", correct: false, explanation: "סיכון להפרעת קצב או דום לב בדרך. רק אמבולנס עם דפיברילטור." }
      ]
    },

    modelResponse: "1. קליטה. 2. הגעה: PPE, בטיחות, דיווח. 3. גישה: XABCDE - מדבר אם בקושי, נשימה 24 + SpO2 93% → חמצן, דופק 105 ועור חיוור-מזיע = ACS חזק. AVPU=A. חשיפה - אין טראומה, מצביע מרכז חזה, מקרין לשמאל. 4. מדדים: BP 150/95, P 105, RR 24, SpO2 93%, סוכר 110. 5. שיחה - SAMPLE+OPQRST: כאב לוחץ מרכזי, מקרין שמאל, 30 דק', סוכרתי, יל\"ד, מעשן. 6. טיפול: אספירין 250 ללעיסה (אין אלרגיה), חמצן ל-94%+, חצי-ישיבה, ניטור. 7. ALS דחוף ישירות לחדר צנתורים."
  },

  // ============ 3. STROKE ============
  {
    id: "scenario-stroke",
    title: "חשד לאירוע מוחי",
    topic: "מערכת העצבים",
    difficulty: 2,
    emoji: "🧠",

    dispatch: {
      text: "מוקד לכוננים. אישה בת 75, רחוב ביאליק 8, בעלה מדווח שלא יכולה לדבר ויש לה חולשה ביד ימין. החל לפני שעה. בעלה ער ומדבר עברית.",
      acceptKeywords: ["קיבלתי", "מקבל", "יוצא לקריאה", "בדרך"]
    },

    scene: {
      description: "הבעל פותח את הדלת מודאג. אשתו יושבת בכיסא בסלון. הצד הימני של הפנים נפול, פיה עקומה. מנסה לדבר אך רק קולות. מודעת לכם, מנידה את ראשה.",
      hazards: ["אין מטרדים"],
      safetyChecklist: [
        { label: "ציוד מגן אישי", keywords: ["ווסט", "כפפות"], critical: true },
        { label: "הערכת בטיחות זירה", keywords: ["בטוח", "בטיחות"], critical: true },
        { label: "דיווח הגעה למוקד", keywords: ["הגעה", "במקום"], critical: true }
      ]
    },

    primary: {
      x: { check: "דימום מסיבי", keywords: ["דימום", "X"], finding: "אין דימום." },
      a: { check: "נתיב אוויר", keywords: ["נתיב אוויר", "Airway"], finding: "נתיב אוויר פתוח, נושמת עצמאית. סיכון לאספירציה!" },
      b: { check: "נשימה", keywords: ["נשימה", "Breathing"], finding: "נשימות 18, סימטריות. סטורציה 96%." },
      c: { check: "מחזור דם", keywords: ["דופק", "Circulation"], finding: "דופק 88 לא סדיר (פרפור פרוזדורים!). עור תקין." },
      d: { check: "רמת הכרה + FAST", keywords: ["הכרה", "AVPU", "FAST", "פנים", "יד", "דיבור"], finding: "FAST חיובי: פנים אסימטריות (Face), חולשה ביד ימין (Arm), אפזיה (Speech). זמן (Time) - שעה.", criticalAction: "FAST חיובי - שבץ עד שיוכח אחרת!" },
      e: { check: "חשיפה", keywords: ["חשיפה", "Exposure"], finding: "אין סימני טראומה. אין סימני התעללות." }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "180/100", abnormal: true },
      { name: "דופק", keywords: ["דופק", "Pulse"], value: "88 לא סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "18 לדקה" },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "96%" },
      { name: "סוכר", keywords: ["סוכר", "גלוקוז", "BGL"], value: "115 (תקין - שבץ אמיתי, לא היפו!)", abnormal: false },
      { name: "טמפרטורה", keywords: ["טמפרטורה"], value: "36.7" },
      { name: "אישונים", keywords: ["אישונים", "PERRLA"], value: "שווים מגיבים לאור" }
    ],

    patientResponses: [
      { keywords: ["מתי", "Last Known Well"], answer: "(בעל) ראיתי אותה ב-7 בערב. לפני שעה מצאתי אותה ככה." },
      { keywords: ["יל\"ד", "לחץ דם"], answer: "(בעל) יש לה יל\"ד וגם פרפור פרוזדורים." },
      { keywords: ["מדללי דם", "אקסרלטו", "וורפרין"], answer: "(בעל) לוקחת אקסרלטו לפרפור." },
      { keywords: ["סוכרת"], answer: "(בעל) לא, אין סוכרת." },
      { keywords: ["אלרגיה"], answer: "(בעל) אלרגית לפניצילין." },
      { keywords: ["תרופות"], answer: "(בעל) אקסרלטו, אנלפריל, ביזופרולול, סטטין." },
      { keywords: ["נפלה", "ראש"], answer: "(בעל) לא, לא נפלה." }
    ],

    treatments: {
      correct: [
        { name: "תנוחה: ראש מורם 30° (אם אין שוק)", keywords: ["ראש מורם", "תנוחה"], rationale: "מקטין לחץ תוך-גולגולתי" },
        { name: "חמצן רק אם SpO2<94%", keywords: ["חמצן"], rationale: "חמצן עודף מזיק במוח איסכמי" },
        { name: "ניטור רציף + מדדים חוזרים", keywords: ["ניטור", "מדדים חוזרים"], rationale: "מעקב אחר התדרדרות" },
        { name: "שמירה על נתיב אוויר", keywords: ["נתיב אוויר", "אספירציה"], rationale: "סיכון לבליעה משובשת" },
        { name: "תיעוד זמן Last Known Well", keywords: ["Last Known Well", "זמן אחרון"], rationale: "חלון טיפול 4.5 שעות ל-tPA" }
      ],
      contraindicated: [
        { name: "אספירין מיידי", keywords: ["אספירין"], reason: "אם זה שבץ דימומי - אספירין יחמיר! לחכות לאבחנה ב-CT" },
        { name: "הורדת לחץ דם אגרסיבית", keywords: ["הורדת לחץ", "טיפול ליל\"ד"], reason: "ל\"ד גבוה בשבץ הוא מנגנון פיצוי - הורדה מהירה תפגע במוח" },
        { name: "מתן מים/אוכל דרך הפה", keywords: ["מים", "אוכל"], reason: "אפזיה + שיתוק = סיכון לאספירציה" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) לחדר שבץ עם CT", correct: true, explanation: "FAST חיובי + חלון של עד 4.5 שעות = ALS דחוף ל-Stroke Center עם יכולת tPA/Thrombectomy. תיעוד LKW קריטי!" },
        { label: "BLS רגיל למיון הקרוב", correct: false, explanation: "שבץ דורש Stroke Center עם CT וניורולוג. BLS לא מספיק. חלון הזמן קריטי." },
        { label: "המתנה לבדיקת CT ביתי", correct: false, explanation: "אין CT ביתי. אסור לעכב פינוי - Time is brain!" },
        { label: "פינוי לבית חולים קטן הכי קרוב", correct: false, explanation: "ל-Stroke Center, גם אם יותר רחוק. שם יכולת tPA וצנתור מוחי." }
      ]
    },

    modelResponse: "1. קליטה. 2. הגעה: PPE, בטיחות, דיווח. 3. גישה: XABCDE - נתיב פתוח אך סיכון אספירציה, נשימה 18 + SpO2 96% (לא חמצן!), דופק 88 לא סדיר = AF! AVPU=A. FAST חיובי: פנים+יד+דיבור+זמן. סוכר 115 (לא היפו). 4. מדדים: BP 180/100, P 88 AF, RR 18, SpO2 96%, סוכר 115. 5. שיחה - LKW לפני שעה, AF, אקסרלטו. 6. טיפול: ראש 30°, NPO, ניטור, **לא** להוריד ל\"ד, **לא** לתת חמצן ללא צורך. 7. ALS קוד 3 ל-Stroke Center עם תיעוד LKW מדויק."
  },

  // ============ 4. PENETRATING TRAUMA ============
  {
    id: "scenario-gsw-abdomen",
    title: "פצע ירי בבטן",
    topic: "טראומה",
    difficulty: 3,
    emoji: "🩸",

    dispatch: {
      text: "מוקד לכוננים. אירוע ירי ברחוב הפועלים 12. גבר נפצע בבטן. משטרה במקום ומבטיחה את הזירה. ממתינים לאישור כניסה בטוחה. אל תיכנסו עד אישור!",
      acceptKeywords: ["קיבלתי", "מקבל", "מאשר", "מחכה לאישור"]
    },

    scene: {
      description: "המשטרה נותנת אישור כניסה. גבר בן 28 שוכב על המדרכה, חולצתו רוויה דם. רואים פצע כניסה בבטן ימנית-עליונה ופצע יציאה בגב. דם זורם בכמות. הוא חיוור, מבולבל. סביבו שוטרים ואזרחים.",
      hazards: ["סוף ירי - לוודא בטיחות", "דם / סיכון זיהומי", "סביבה רגישה (פלילי)"],
      safetyChecklist: [
        { label: "המתנה לאישור משטרה", keywords: ["משטרה", "אישור", "בטוח"], critical: true },
        { label: "ציוד מגן + משקפי מגן (דם)", keywords: ["ווסט", "כפפות", "משקפיים"], critical: true },
        { label: "בקשת ALS מיידית", keywords: ["ALS", "ניידת נמרץ"], critical: true },
        { label: "דיווח הגעה למוקד", keywords: ["הגעה", "במקום"], critical: true }
      ]
    },

    primary: {
      x: { check: "דימום מסיבי", keywords: ["דימום", "X", "MARCH"], finding: "דימום משמעותי מהבטן הימנית. אין דימום בגפיים שניתן לחסום.", criticalAction: "לחץ ישיר על הפצע + Packing!" },
      a: { check: "נתיב אוויר", keywords: ["נתיב אוויר", "Airway"], finding: "נתיב אוויר פתוח, מדבר אבל בקושי." },
      b: { check: "נשימה", keywords: ["נשימה", "Breathing"], finding: "נשימות 32 מהירות ושטחיות. סטורציה 88%. סימטרי." },
      c: { check: "מחזור דם", keywords: ["דופק", "Circulation"], finding: "דופק 140 חלש. עור חיוור-קר-לח. CRT 4 שניות. ל\"ד 80/50!", criticalAction: "סימני שוק חמורים!" },
      d: { check: "רמת הכרה", keywords: ["הכרה", "AVPU", "GCS"], finding: "AVPU = V (מגיב לקול אבל מבולבל). GCS ~13." },
      e: { check: "חשיפה - גוף מלא", keywords: ["חשיפה", "Exposure"], finding: "פצע כניסה ימני-עליון בבטן (~3 ס\"מ), פצע יציאה בגב באותה רמה. אין פציעות נוספות. שמירה על חום." }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "80/50 (שוק!)", abnormal: true },
      { name: "דופק", keywords: ["דופק", "Pulse"], value: "140 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "32 מהירות שטחיות", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "88%", abnormal: true },
      { name: "טמפרטורה", keywords: ["טמפרטורה"], value: "35.8 (היפותרמיה!)" , abnormal: true },
      { name: "GCS", keywords: ["GCS", "הכרה"], value: "13 (E3 V4 M6) - מבולבל" }
    ],

    patientResponses: [
      { keywords: ["מה קרה", "ירי"], answer: "...ירו בי... 3 דקות... כואב נורא..." },
      { keywords: ["איפה כואב"], answer: "...בטן... ימינה..." },
      { keywords: ["שם", "איך קוראים"], answer: "...יוסי..." },
      { keywords: ["מחלות"], answer: "...אין..." },
      { keywords: ["תרופות"], answer: "...כלום..." },
      { keywords: ["אלרגיה"], answer: "...לא..." }
    ],

    treatments: {
      correct: [
        { name: "לחץ ישיר על הפצע + פאקינג", keywords: ["לחץ ישיר", "פאקינג", "Packing"], rationale: "MARCH - דימום ראשון" },
        { name: "חמצן 15 ליטר", keywords: ["חמצן", "15 ליטר", "מסכה"], rationale: "סטורציה 88% + שוק" },
        { name: "פינוי בעמדה אנכית (Permissive Hypotension)", keywords: ["פינוי דחוף", "בעמדה", "אנכי"], rationale: "אסור להזיז יותר מהנדרש" },
        { name: "שמירה על חום (שמיכה זרה)", keywords: ["שמיכה", "חום", "היפותרמיה"], rationale: "MARCH - H = Hypothermia. סיכון רב לשוק" },
        { name: "כיסוי תלת-צידי לפצע חזה (אם רלוונטי)", keywords: ["כיסוי תלת צידי", "Chest seal"], rationale: "לא במקרה זה - הפצע בבטן, אבל לזכור" },
        { name: "ניטור + מדדים חוזרים כל 3-5 דק'", keywords: ["ניטור", "מדדים חוזרים"], rationale: "מטופל לא יציב" }
      ],
      contraindicated: [
        { name: "החזרת איברים פנימיים אם בלטו", keywords: ["החזרה", "איברים"], reason: "אסור! לכסות בלבד עם גזה רטובה" },
        { name: "מתן נוזלים PO", keywords: ["מים", "שתייה"], reason: "NPO לקראת ניתוח דחוף" },
        { name: "ניסיון לעצור דימום פנימי", keywords: ["דימום פנימי"], reason: "לא ניתן בשטח - רק לקדם פינוי" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) לחדר טראומה Level 1", correct: true, explanation: "פצע ירי בבטן + שוק = מקסימום דחיפות לחדר טראומה שלישוני. 'Golden 10 minutes'. הפינוי בעצמו הוא הטיפול." },
        { label: "BLS למיון מקומי", correct: false, explanation: "פצע ירי בבטן דורש ניתוח דחוף - רק טראומה Level 1. BLS לא יספיק." },
        { label: "המתנה במקום עד מצב יציב", correct: false, explanation: "אסור! Scoop and run בטראומה חודרת. הזמן הוא הטיפול." },
        { label: "התייעצות עם משטרה לפני פינוי", correct: false, explanation: "המשטרה לא קובעת על טיפול רפואי. פינוי דחוף ראשון. תיעוד פלילי - בבית חולים." }
      ]
    },

    modelResponse: "1. קליטה ובדיקה שזירה מבוטחת ע\"י משטרה. 2. הגעה: PPE+משקפי מגן, ALS מיידי. 3. גישה: MARCH! M=דימום מסיבי - לחץ ישיר+פאקינג. A=פתוח, B=32+88% חמצן 15L, C=שוק עמוק 80/50 דופק 140, D=GCS 13, E=פצע כניסה+יציאה, שמיכה. 4. מדדים: BP 80/50, P 140, RR 32, SpO2 88%, T 35.8, GCS 13. 5. שיחה - ירו בו, NKA. 6. טיפול: לחץ+חמצן+שמיכה+ניטור. **לא** להזיז יותר מהנדרש (Permissive hypotension). 7. ALS קוד 3 לטראומה Level 1 - הפינוי הוא הטיפול."
  },

  // ============ 5. ANAPHYLAXIS ============
  {
    id: "scenario-anaphylaxis-restaurant",
    title: "אנפילקסיס במסעדה",
    topic: "אלרגיות",
    difficulty: 2,
    emoji: "⚠️",

    dispatch: {
      text: "מוקד לכוננים. מסעדה ברחוב דיזנגוף 100. גבר בן 35 התחיל לחנוק אחרי שאכל. פניו נפוחות, מתקשה לנשום. ידידיו במקום, אחת מהן אחות.",
      acceptKeywords: ["קיבלתי", "יוצא לקריאה", "בדרך"]
    },

    scene: {
      description: "אתם מגיעים למסעדה. בפינה גבר בן 35 יושב בכיסא, מחזיק את הצוואר. פניו אדומות ונפוחות, השפתיים מאוד גדולות. נושם בקושי, נשמע צפצופים. כל הגוף מכוסה בפריחה אדומה. חברה אחות לידו.",
      hazards: ["צרעות/מזון בסביבה", "אזעקה ציבורית"],
      safetyChecklist: [
        { label: "ציוד מגן אישי", keywords: ["ווסט", "כפפות"], critical: true },
        { label: "הערכת בטיחות זירה", keywords: ["בטוח", "בטיחות"], critical: true },
        { label: "בקשת ALS דחוף", keywords: ["ALS", "ניידת נמרץ"], critical: true },
        { label: "דיווח הגעה", keywords: ["הגעה", "במקום"], critical: true },
        { label: "פינוי אזור ממטרדים", keywords: ["פינוי", "מקום"], critical: false }
      ]
    },

    primary: {
      x: { check: "דימום מסיבי", keywords: ["דימום"], finding: "אין דימום." },
      a: { check: "נתיב אוויר - בצקת!", keywords: ["נתיב אוויר", "Airway", "בצקת"], finding: "בצקת משמעותית בשפתיים, פנים, ובלשון. הפה פתוח, נושם דרכו. סיכון לאיבוד נתיב אוויר!", criticalAction: "איום מיידי על נתיב אוויר!" },
      b: { check: "נשימה", keywords: ["נשימה", "Breathing"], finding: "נשימות 32 עם wheezing דו-צדדי חזק. סטורציה 86%. שימוש בשרירי עזר." },
      c: { check: "מחזור דם", keywords: ["דופק", "Circulation"], finding: "דופק 130 חלש. ל\"ד 75/45! עור חם ונרבל." },
      d: { check: "רמת הכרה", keywords: ["הכרה", "AVPU"], finding: "AVPU = A (Alert) אבל חרד מאוד. סוכר 110." },
      e: { check: "חשיפה", keywords: ["חשיפה"], finding: "פריחה אדומה (urticaria) על כל הגוף. נפיחות בפנים מתקדמת." }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "75/45 (שוק!)", abnormal: true },
      { name: "דופק", keywords: ["דופק", "Pulse"], value: "130 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "32 עם wheeze", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "86%", abnormal: true },
      { name: "טמפרטורה", keywords: ["טמפרטורה"], value: "37.0" },
      { name: "סוכר", keywords: ["סוכר"], value: "110" }
    ],

    patientResponses: [
      { keywords: ["מה אכל", "אוכל"], answer: "...שריף... אגוזים..." },
      { keywords: ["אלרגיה"], answer: "...אגוזים... ידוע..." },
      { keywords: ["אפיפן"], answer: "...בתיק... שכחתי בעבודה..." },
      { keywords: ["מתי", "כמה זמן"], answer: "...10 דקות..." },
      { keywords: ["בעבר"], answer: "...פעם אחת... בילדות..." },
      { keywords: ["תרופות"], answer: "...לא..." }
    ],

    treatments: {
      correct: [
        { name: "אדרנלין (אפיפן) IM 0.3 מ\"ג בירך", keywords: ["אדרנלין", "אפיפן", "אפי-פן", "0.3", "IM"], rationale: "אנפילקסיס = אדרנלין מיד! הטיפול הראשון והחשוב ביותר" },
        { name: "חמצן 15 ליטר", keywords: ["חמצן", "15 ליטר"], rationale: "סטורציה 86% + שוק" },
        { name: "תנוחת הלם - שכיבה + הרמת רגליים", keywords: ["הלם", "רגליים", "Trendelenburg", "שכיבה"], rationale: "שוק היפוולמי - לקדם דם למוח" },
        { name: "ALS דחוף - אדרנלין שני אם אין שיפור", keywords: ["ALS", "ניידת נמרץ"], rationale: "ייתכן צורך באדרנלין נוסף ובאינטובציה" },
        { name: "ניטור רציף + מדדים חוזרים", keywords: ["ניטור", "מדדים חוזרים"], rationale: "התדרדרות מהירה אפשרית" }
      ],
      contraindicated: [
        { name: "אנטיהיסטמין במקום אדרנלין", keywords: ["אנטיהיסטמין", "אקמול"], reason: "אנפילקסיס דורש אדרנלין - אנטיהיסטמין לא מספיק לטיפול חירום" },
        { name: "סטרואידים כטיפול חירום", keywords: ["סטרואיד", "פרדניזון"], reason: "סטרואיד תופס לאחר 4-6 שעות - לא מועיל בחירום" },
        { name: "הכנסת tube דרך הפה אם יש בצקת קשה", keywords: ["טובוס", "אינטובציה"], reason: "מחוץ לסמכות חובש - ALS בלבד" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) - אדרנלין IM ופינוי דחוף", correct: true, explanation: "אנפילקסיס עם שוק ובצקת נתיב אוויר = חירום מסכן חיים. אדרנלין IM 0.3 מ\"ג בירך מיד, חמצן, ALS דחוף לטיפול נוסף ואינטובציה אפשרית." },
        { label: "BLS למיון - יספיק לטיפול", correct: false, explanation: "אנפילקסיס עם שוק דורש ALS. ייתכן יידרשו מנות אדרנלין נוספות ואינטובציה." },
        { label: "המתנה לראות אם הסטרואידים יעזרו", correct: false, explanation: "סטרואידים לא מועילים בחירום. כל דקה ללא אדרנלין מסכנת חיים." },
        { label: "אדרנלין SC (תת-עורי)", correct: false, explanation: "**IM בירך** בלבד! SC ספיגה איטית - לא מתאים לחירום." }
      ]
    },

    modelResponse: "1. קליטה. 2. הגעה: PPE, בטיחות, ALS דחוף. 3. גישה: XABCDE - **A=בצקת בנתיב אוויר! איום מיידי**, B=32+86%+wheeze חמצן 15L, C=שוק 75/45 דופק 130, D=Alert חרד, E=urticaria. 4. מדדים: BP 75/45, P 130, RR 32, SpO2 86%. 5. שיחה - אגוזים, אלרגיה ידועה. 6. **טיפול #1: אדרנלין IM 0.3 בירך מיד!** + חמצן 15L + שכיבה+הרמת רגליים + ניטור. אפיפן שני אם אין שיפור תוך 5-10 דק'. 7. ALS קוד 3 דחוף."
  },

  // ============ 6. PEDIATRIC BURN ============
  {
    id: "scenario-peds-burn",
    title: "כווייה בילד",
    topic: "ילדים",
    difficulty: 2,
    emoji: "🔥",

    dispatch: {
      text: "מוקד לכוננים. דירה בבן יהודה 50. ילד בן שנתיים נכווה ממים רותחים מהקומקום. אמא מבוהלת. ילד צורח מכאב. אין שריפה.",
      acceptKeywords: ["קיבלתי", "יוצא לקריאה", "בדרך"]
    },

    scene: {
      description: "האמא פותחת לכם בבכי. בסלון על השטיח ילד בן שנתיים צורח, חולצתו רטובה. רואים אדמומיות עם שלפוחיות על הזרוע השמאלית, החזה והבטן. סך הכל נראה ~15% משטח הגוף. הילד ער ובוכה - סימן טוב.",
      hazards: ["קומקום על הרצפה", "מים רותחים"],
      safetyChecklist: [
        { label: "ציוד מגן אישי", keywords: ["ווסט", "כפפות"], critical: true },
        { label: "הערכת בטיחות (מים רותחים)", keywords: ["בטוח", "בטיחות"], critical: true },
        { label: "דיווח הגעה", keywords: ["הגעה", "במקום"], critical: true },
        { label: "בקשת ALS לפי שטח", keywords: ["ALS"], critical: false }
      ]
    },

    primary: {
      x: { check: "דימום", keywords: ["דימום"], finding: "אין דימום." },
      a: { check: "נתיב אוויר - חשד שאיפת קיטור", keywords: ["נתיב אוויר", "שאיפה", "קיטור", "פיח"], finding: "נתיב אוויר פתוח. אין סימני שאיפת קיטור (אין פיח באף/פה, אין חירחור, אין כווייה בפנים)." },
      b: { check: "נשימה", keywords: ["נשימה", "Breathing"], finding: "נשימות 32 (תקין לגיל), סימטריות. סטורציה 99%." },
      c: { check: "מחזור דם", keywords: ["דופק"], finding: "דופק 150 (טכיקרדיה - כאב/חרדה). CRT 2 שניות. עור בקצוות תקין." },
      d: { check: "רמת הכרה", keywords: ["הכרה", "AVPU"], finding: "Alert, בוכה ומגיב לאמא. סוכר 95." },
      e: { check: "חשיפה - הערכת שטח ועומק", keywords: ["חשיפה", "שטח", "Rule of 9", "דרגה"], finding: "כוויות דרגה 2 (אדום + שלפוחיות) על: זרוע שמאל מלאה (~5%) + חזה+בטן עליונה (~10%) = סה\"כ ~15% שטח גוף.", criticalAction: ">10% בילד = כוויה משמעותית" }
    },

    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "100/60 (תקין לגיל)" },
      { name: "דופק", keywords: ["דופק", "Pulse"], value: "150 (טכיקרדיה - כאב)", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "32 (תקין לגיל 2)" },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "99%" },
      { name: "סוכר", keywords: ["סוכר"], value: "95" },
      { name: "טמפרטורה", keywords: ["טמפרטורה"], value: "36.5" },
      { name: "משקל מוערך", keywords: ["משקל", "ק\"ג"], value: "12 ק\"ג (גיל 2)" }
    ],

    patientResponses: [
      { keywords: ["מה קרה", "איך"], answer: "(אמא בוכה) שמתי את הקומקום על הריצפה לרגע, והוא משך אותו עליו!" },
      { keywords: ["מתי"], answer: "(אמא) לפני 10 דקות." },
      { keywords: ["מים", "קור"], answer: "(אמא) שטפתי במים קרים מהברז."  },
      { keywords: ["משקל", "ק\"ג"], answer: "(אמא) 12 קילו." },
      { keywords: ["אלרגיה"], answer: "(אמא) אין." },
      { keywords: ["תרופות"], answer: "(אמא) רק ויטמינים." },
      { keywords: ["מחלות"], answer: "(אמא) בריא לחלוטין." }
    ],

    treatments: {
      correct: [
        { name: "מים פושרים (לא קרים!) על הכוויה 10-20 דק'", keywords: ["מים", "פושרים", "שטיפה", "קירור"], rationale: "מים פושרים = הטיפול הנכון. **לא קרח** - גורם נזק נוסף" },
        { name: "כיסוי בגזה סטרילית רטובה", keywords: ["גזה", "סטרילית", "כיסוי"], rationale: "מונע זיהום, שומר על לחות" },
        { name: "שמירה על חום הגוף", keywords: ["שמיכה", "חום", "היפותרמיה"], rationale: "ילדים מאבדים חום מהר, במיוחד עם כוויה" },
        { name: "אנלגזיה - לפי פרוטוקול ALS", keywords: ["משכך כאב", "אנלגזיה"], rationale: "כאב חזק - ALS עם פנטניל IN/IV" },
        { name: "ALS - נוזלים IV לפי Parkland", keywords: ["נוזלים", "Parkland", "IV"], rationale: "15% בילד = נדרשת נוזלים IV (לא בסמכות חובש)" },
        { name: "פינוי דחוף למרכז כוויות", keywords: ["פינוי", "מרכז כוויות"], rationale: "ילד עם 15% = מרכז כוויות מתמחה" }
      ],
      contraindicated: [
        { name: "מריחת שמן/משחה/חמאה", keywords: ["שמן", "משחה", "חמאה", "קרם"], reason: "אסור! גורם לעכוב חום ולזיהום" },
        { name: "פיצוץ שלפוחיות", keywords: ["פיצוץ", "שלפוחית"], reason: "השלפוחית היא מגן טבעי - אסור לפצוץ" },
        { name: "מים קרים מהמקרר/קרח", keywords: ["מים קרים", "קרח"], reason: "גורם להיפותרמיה ולנזק נוסף לרקמה" },
        { name: "הסרת בגדים שדבקו", keywords: ["הסרת בגדים", "להסיר"], reason: "אסור - יגרור עור. רק לחתוך סביב" }
      ]
    },

    transport: {
      options: [
        { label: "ALS דחוף (קוד 3) למרכז כוויות פדיאטרי", correct: true, explanation: "ילד עם 15% שטח גוף = כוויה משמעותית. דורש נוזלים IV (Parkland), אנלגזיה, ומרכז כוויות פדיאטרי מתמחה." },
        { label: "BLS לבית חולים הקרוב", correct: false, explanation: "15% בילד = חמור. דורש מרכז מתמחה גם אם יותר רחוק. ALS נדרש." },
        { label: "המתנה לראיית רופא משפחה למחרת", correct: false, explanation: "אסור! כוויה משמעותית בילד = חירום מיידי." },
        { label: "פינוי במכונית פרטית של ההורים", correct: false, explanation: "נוזלים IV ואנלגזיה צריכות להתחיל בדרך. רק אמבולנס." }
      ]
    },

    modelResponse: "1. קליטה. 2. הגעה: PPE, בטיחות (קומקום!). 3. גישה: XABCDE - A=פתוח (לא שאיפה), B=32+99%, C=דופק 150 כאב, D=Alert בוכה, E=הערכת שטח 15% דרגה 2 (זרוע+חזה+בטן). 4. מדדים: BP 100/60, P 150, RR 32, SpO2 99%, משקל 12 ק\"ג. 5. שיחה - מים רותחים, אמא שטפה במים, NKA. 6. טיפול: מים **פושרים** 10-20 דק', גזה סטרילית רטובה, שמיכה (היפותרמיה!), אנלגזיה ALS, נוזלים IV ALS. **לא** משחה/קרח/פיצוץ שלפוחיות. 7. ALS קוד 3 למרכז כוויות פדיאטרי."
  },

  // ==================== BATCH 2: 44 NEW SCENARIOS ====================
  // These use the same 7-phase structure but with tighter content for scale.

  // ============ 7. STEMI - ACS ============
  {
    id: "scenario-stemi",
    title: "כאב חזה - חשד STEMI",
    topic: "לב וכלי דם",
    difficulty: 2,
    emoji: "❤️",
    dispatch: { text: "מוקד לכוננים. גבר בן 62 עם כאב חזה חזק כבר 40 דקות, בבית, אשתו התקשרה. אצל האדם היסטוריה של יתר לחץ דם. אמבולנס בדרך.", acceptKeywords: ["קיבלתי", "בדרך", "יוצא"] },
    scene: {
      description: "אתם מגיעים לדירה בקומה 2. הגבר יושב על ספה, מחזיק את החזה, מזיע. אשתו לצידו חרדה. אין סכנה בזירה.",
      hazards: ["מדרגות לקומה 2", "לחץ רגשי"],
      safetyChecklist: [
        { label: "ציוד PPE", keywords: ["ווסט", "כפפות", "PPE"], critical: true },
        { label: "הגעה נמסרה למוקד", keywords: ["הגעה", "הגענו"], critical: true },
        { label: "הזמנת ALS מיידית", keywords: ["ALS", "נמרץ", "פראמדיק"], critical: true }
      ]
    },
    primary: {
      x: { check: "דימום חיצוני", keywords: ["X", "דימום"], finding: "אין דימום." },
      a: { check: "נתיב אוויר", keywords: ["A", "אוויר"], finding: "פתוח, מדבר במשפטים קצרים." },
      b: { check: "נשימה", keywords: ["B", "נשימה"], finding: "24 לדקה, סטורציה 94%, ללא רעשים." },
      c: { check: "מחזור", keywords: ["C", "דופק"], finding: "דופק 105 סדיר, עור חיוור וקר, מזיע בהתמדה." },
      d: { check: "הכרה + סוכר", keywords: ["D", "הכרה", "סוכר"], finding: "Alert, כאב עד 8/10. סוכר 128." },
      e: { check: "חשיפה", keywords: ["E", "חשיפה"], finding: "אין חבלה. גב תקין." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם", "BP"], value: "160/95", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "105 סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות", "RR"], value: "24", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה", "SpO2"], value: "94%", abnormal: true },
      { name: "סוכר", keywords: ["סוכר"], value: "128" }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל", "כמה זמן"], answer: "לפני 40 דקות בערך, כשקמתי מהכיסא לענות לטלפון." },
      { keywords: ["איפה", "מקום", "כאב"], answer: "כאן במרכז החזה, לוחץ כאילו פיל יושב עלי." },
      { keywords: ["מקרין", "זרוע", "לסת"], answer: "כן, מקרין לזרוע שמאל ולסת." },
      { keywords: ["דרגה", "עוצמה", "1 עד 10"], answer: "8 מתוך 10, חזק מאוד." },
      { keywords: ["בחילה", "הזעה"], answer: "כן, בחילה ומזיע כמו מקלחת." },
      { keywords: ["תרופות"], answer: "רמיפריל ללחץ דם. אספירין 100 בבקרים." },
      { keywords: ["אלרגיה"], answer: "לא ידוע לי." },
      { keywords: ["אוטם", "עבר", "צנתור"], answer: "לא, מעולם לא." }
    ],
    treatments: {
      correct: [
        { name: "חמצן להעלאת סטורציה ≥94%", keywords: ["חמצן", "O2"], rationale: "SpO2 94% - להעלות ל-≥94% (לא יותר, למנוע היפראוקסיה)." },
        { name: "אספירין 300 מ\"ג ללעיסה", keywords: ["אספירין"], rationale: "מעכב טסיות, מציל חיים ב-ACS. חלק מ-MONA." },
        { name: "מנוחה מוחלטת, ישיבה נוחה", keywords: ["מנוחה", "ישיבה"], rationale: "מפחית עומס על הלב, מפחית דרישת חמצן." },
        { name: "פינוי דחוף למרכז צנתור", keywords: ["פינוי", "דחוף", "צנתור"], rationale: "Time = Muscle. יעד: כניסה לצנתור תוך 90 דק' מהחיוג." }
      ],
      contraindicated: [
        { name: "מתן ניטרוגליצרין ללא ALS", keywords: ["ניטרו"], reason: "אסור לחובש - סמכות ALS. יכול לגרום ליל\"ד נמוך משמעותי." },
        { name: "הליכה עצמאית לאמבולנס", keywords: ["הליכה", "עמידה"], reason: "מגביר עומס לב = מעמיק אוטם. פינוי במיטה." }
      ]
    },
    transport: {
      options: [
        { label: "ALS דחוף למרכז צנתור", correct: true, explanation: "STEMI = מרכז PCI תוך 90 דק'. ALS יכול לתת ניטרו, מורפין, אנטיאמטי." },
        { label: "BLS לבית חולים הקרוב", correct: false, explanation: "צריך צנתור מיידי. גם אם המרכז רחוק - הצנתור מוריד תמותה." },
        { label: "המתנה שיעבור לבד", correct: false, explanation: "50% מוות מ-STEMI קורה בשעה הראשונה. Time = Muscle." }
      ]
    },
    modelResponse: "1. קליטה + ALS מיידי. 2. הגעה: PPE + דיווח. 3. XABCDE - כל תקין, B=24+94%, כאב 8/10. 4. מדדים: 160/95, 105, 24, 94%, סוכר 128. 5. שיחה: OPQRST - לוחץ, מקרין לשמאל+לסת, מזיע, בחילה, יל\"ד ברקע, אספירין 100 בבקרים. 6. חמצן להעלאת SpO2, **אספירין 300 ללעיסה**, מנוחה מוחלטת, ניטור. 7. ALS קוד 3 למרכז צנתור."
  },

  // ============ 8. Acute Pulmonary Edema (CHF) ============
  {
    id: "scenario-cardiogenic-pulm-edema",
    title: "בצקת ריאות חדה - CHF",
    topic: "לב וכלי דם",
    difficulty: 3,
    emoji: "🫁",
    dispatch: { text: "מוקד. אישה בת 78 עם קוצר נשימה קשה בבית, יצאה מהמיטה בגיל 3:00 עם השתנקות. רקע לב כרוני.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: {
      description: "האישה יושבת בקצה הכיסא רכונה קדימה (Tripod position). נשימה שטחית ורועשת, ליחה ורודה מוקצפת בשפתיים. חיוורת ולחה.",
      hazards: ["בצקת ריאות חמורה"],
      safetyChecklist: [
        { label: "PPE", keywords: ["ווסט", "כפפות"], critical: true },
        { label: "הזמנת ALS", keywords: ["ALS", "נמרץ"], critical: true }
      ]
    },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, ליחה ורודה בשפתיים." },
      b: { check: "נשימה", keywords: ["B"], finding: "36 שטחית, קולות רטובים (Rales) בכל שדות הריאה, סטורציה 82%.", criticalAction: "חמצן high-flow!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130 סדיר, עור חיוור וקר, ורידי צוואר נפוחים." },
      d: { check: "הכרה + סוכר", keywords: ["D"], finding: "Alert אך חרדה. סוכר 145." },
      e: { check: "חשיפה", keywords: ["E"], finding: "בצקת בשוקיים 2+." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "195/110", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130 סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "36", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "82%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "התעוררתי בשלוש בבוקר בהרגשה שאני נחנקת. לא יכולה לשכב." },
      { keywords: ["איך", "מרגישה"], answer: "אני נחנקת... כאילו אני טובעת." },
      { keywords: ["בעבר", "רקע", "לב"], answer: "יש לי אי ספיקת לב 5 שנים. יתר לחץ דם 20 שנה." },
      { keywords: ["תרופות"], answer: "פוריד (משתן), אנלפריל, אספירין." },
      { keywords: ["כאב חזה"], answer: "יש לחץ בחזה, לא חזק." },
      { keywords: ["רגליים", "בצקת"], answer: "הרגליים נפוחות כמה ימים." }
    ],
    treatments: {
      correct: [
        { name: "חמצן high-flow (NRB 15L)", keywords: ["חמצן", "NRB"], rationale: "SpO2 82% - קריטי. NRB עם reservoir." },
        { name: "ישיבה זקופה, רגליים תלויות למטה", keywords: ["ישיבה", "זקוף"], rationale: "מפחית return venous ללב = מפחית עומס." },
        { name: "פינוי דחוף ALS", keywords: ["ALS", "פינוי דחוף"], rationale: "צריך CPAP + ניטרו IV + לוקסיפור IV - כולם ALS." }
      ],
      contraindicated: [
        { name: "השכבה שטוחה", keywords: ["שכיבה", "שטוח"], reason: "מחמיר את הבצקת - יותר דם חוזר ללב." },
        { name: "מתן נוזלים IV", keywords: ["נוזלים", "עירוי"], reason: "יחמיר בצקת ריאות - זה overload, לא dehydration!" }
      ]
    },
    transport: {
      options: [
        { label: "ALS דחוף לחדר מיון", correct: true, explanation: "CPAP + לוקסיפור IV + ניטרו IV מצילים חיים. ALS חיוני." },
        { label: "BLS רגיל", correct: false, explanation: "בלי CPAP וטיפול IV, הסיכוי לניצול קטן." },
        { label: "לתת לה להירגע בבית", correct: false, explanation: "מסכן חיים - בצקת ריאות חדה יכולה להיות קטלנית בדקות." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. הגעה+PPE. 3. XABCDE - B קריטי (36+82%+רטוב). 4. מדדים חמורים (195/110, 130, 36, 82%). 5. שיחה: PND, אורתופנאה, אי ספיקת לב ידוע, לוקחת פוריד. 6. NRB 15L, ישיבה זקופה, ALS. 7. ALS קוד 3 - CPAP בדרך."
  },

  // ============ 9. Severe Asthma ============
  {
    id: "scenario-severe-asthma",
    title: "התקף אסטמה חמור - מבוגר",
    topic: "נשימה",
    difficulty: 2,
    emoji: "💨",
    dispatch: { text: "מוקד. בחורה בת 24 עם התקף אסטמה חמור, לא מגיב לוונטולין. חדר בבית סטודנטים.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: {
      description: "הבחורה יושבת רכונה קדימה, נושמת עם כתפיים מורמות. שקית ונטולין ריקה על השולחן. הפנים חיוורות, שפתיים כחלחלות.",
      hazards: ["מצב נשימתי מתדרדר"],
      safetyChecklist: [
        { label: "PPE + הגעה למוקד", keywords: ["ווסט", "הגעה"], critical: true },
        { label: "הזמנת ALS", keywords: ["ALS"], critical: true }
      ]
    },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח אך מדברת רק במילים בודדות." },
      b: { check: "נשימה", keywords: ["B"], finding: "32 מהירה, צפצופים דו-צדדיים, סטורציה 88%. שרירי עזר.", criticalAction: "חמצן!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130, עור חיוור." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert אך עייפה. סוכר 105." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "140/90" },
      { name: "דופק", keywords: ["דופק"], value: "130", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "32", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "88%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "לפני שעה... הלך והחמיר." },
      { keywords: ["ונטולין", "משאף"], answer: "לקחתי 6 שאיפות... לא עזר." },
      { keywords: ["טריגר", "גורם"], answer: "אני מצוננת ימים. גם היה אבק בחדר." },
      { keywords: ["אשפוז", "בעבר"], answer: "פעמיים בטיפול נמרץ. פעם הונשמתי." },
      { keywords: ["אלרגיה"], answer: "פניצילין." }
    ],
    treatments: {
      correct: [
        { name: "חמצן high-flow", keywords: ["חמצן", "NRB"], rationale: "SpO2 88% - מסוכן, צריך להעלות מיידית." },
        { name: "עוד ונטולין (עד ההגעה)", keywords: ["ונטולין"], rationale: "אפשר לחזור על ונטולין - בלי גבול בהתקף חמור." },
        { name: "ישיבה זקופה", keywords: ["ישיבה"], rationale: "מקסים תפקוד ריאתי." },
        { name: "ALS דחוף", keywords: ["ALS", "דחוף"], rationale: "אסטמה מסכנת חיים - צריך אדרנלין IM, מגנזיום IV." }
      ],
      contraindicated: [
        { name: "השכבה", keywords: ["שכיבה"], reason: "מחמיר את המצוקה הנשימתית." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 לחדר מיון", correct: true, explanation: "אסטמה חמורה = מסכן חיים. יעד: אינטובציה אפשרית." },
        { label: "BLS רגיל", correct: false, explanation: "צריך תרופות ALS - אדרנלין, מגנזיום, אולי אינטובציה." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+הגעה. 3. XABCDE - B קריטי. 4. מדדים. 5. אסטמה מוכרת, ונטולין נכשל, אשפוזים קודמים. 6. חמצן+ונטולין+ישיבה+ALS. 7. ALS קוד 3."
  },

  // ============ 10. Pulmonary Embolism ============
  {
    id: "scenario-pulmonary-embolism",
    title: "תסחיף ריאתי מסיבי",
    topic: "נשימה",
    difficulty: 3,
    emoji: "🩸",
    dispatch: { text: "מוקד. גבר בן 55, קוצר נשימה פתאומי, חזר מטיסה ארוכה ביום שישי. הכאב מחריף.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: {
      description: "הגבר שוכב בחצי-ישיבה על הספה, נושם במהירות, מתלונן על כאב חד בחזה שמוחמר בנשימה עמוקה. חיוור.",
      hazards: ["מצב לב-ריאתי חמור"],
      safetyChecklist: [
        { label: "PPE + הגעה", keywords: ["ווסט", "הגעה"], critical: true },
        { label: "הזמנת ALS", keywords: ["ALS"], critical: true }
      ]
    },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מדבר בקטעים." },
      b: { check: "נשימה", keywords: ["B"], finding: "30 מהירה שטחית, סטורציה 89%, אין רעשים." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 125 סדיר, ל\"ד 100/60, עור חיוור וקר." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert חרדה. סוכר 110." },
      e: { check: "חשיפה", keywords: ["E"], finding: "רגל שמאל נפוחה + כואבת." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "100/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "125 סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "30", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "89%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי"], answer: "לפני שעה בערך, פתאום." },
      { keywords: ["כאב", "איפה"], answer: "בצד ימין של החזה, חד, כמו סכין." },
      { keywords: ["נשימה עמוקה"], answer: "כן! זה מחריף כשאני נושם עמוק." },
      { keywords: ["רגל", "כאב"], answer: "היה לי כאב ברגל שמאל אתמול, חשבתי מהטיסה." },
      { keywords: ["טיסה", "נסיעה"], answer: "חזרתי אתמול מ-12 שעות טיסה." },
      { keywords: ["תרופות"], answer: "כלום קבוע." }
    ],
    treatments: {
      correct: [
        { name: "חמצן high-flow", keywords: ["חמצן"], rationale: "SpO2 89%. תסחיף חוסם חילוף גזים." },
        { name: "ישיבה חצי-שכיבה", keywords: ["ישיבה"], rationale: "נוח לנשימה." },
        { name: "ALS דחוף", keywords: ["ALS"], rationale: "צריך TXA/הפרין/טרומבוליזה - כולם ALS/CCU." }
      ],
      contraindicated: [
        { name: "מסאז' רגל", keywords: ["מסאז", "עיסוי רגל"], reason: "יכול לשחרר עוד קרישים!" },
        { name: "התעלמות מהרגל", keywords: [], reason: "DVT ברור - מקור לתסחיף." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 למרכז לב", correct: true, explanation: "PE מסיבי - סיכון גבוה למוות. צריך CT + טיפול מיידי." },
        { label: "BLS - זה כנראה שרירי", correct: false, explanation: "אין קשר לשריר. DVT+כאב פלאוריטי+טיסה = PE." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+הגעה. 3. XABCDE - B מהיר+89%, רגל נפוחה E. 4. מדדים לא יציבים. 5. אחרי טיסה ארוכה, DVT ברגל, כאב פלאוריטי חד. 6. חמצן+ישיבה+ALS. 7. ALS קוד 3."
  },

  // ============ 11. Hemorrhagic Stroke ============
  {
    id: "scenario-hemorrhagic-stroke",
    title: "שבץ המורגי - כאב ראש פתאומי",
    topic: "נוירולוגי",
    difficulty: 3,
    emoji: "🧠",
    dispatch: { text: "מוקד. אישה בת 55 עם כאב ראש חזק פתאומי בבית, הקיאה פעמיים ואינה עונה כרגיל.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: {
      description: "האישה שוכבת על הרצפה בסלון, בעלה לצידה בהלם. עיניה חצי סגורות, מתלוננת בקושי מכאב ראש \"הכי חזק בחיים\". פעם הקיאה.",
      hazards: ["הידרדרות נוירולוגית"],
      safetyChecklist: [
        { label: "PPE + הגעה", keywords: ["ווסט", "הגעה"], critical: true },
        { label: "הזמנת ALS דחוף", keywords: ["ALS", "דחוף"], critical: true }
      ]
    },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין חיצוני." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מתלוננת בקושי." },
      b: { check: "נשימה", keywords: ["B"], finding: "22, סטורציה 96%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 55 חלש (Cushing!), ל\"ד 220/110." },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מגיבה לקול), אישונים לא שווים (שמאל 5מ\"מ ימין 3מ\"מ). סוכר 130.", criticalAction: "Cushing triad - עלייה בלחץ תוך גולגולתי!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה, אין שיתוקים ברורים." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "220/110", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "55 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "22" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "96%" },
      { name: "אישונים", keywords: ["אישונים", "PERRLA"], value: "אנאזוקוריה - שמאל 5, ימין 3", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "לפני 30 דק'... פתאום... כאילו רעם בראש." },
      { keywords: ["איך מרגיש"], answer: "הכי חזק... בחיים שלי." },
      { keywords: ["הקאה"], answer: "פעמיים." },
      { keywords: ["חבלה", "נפילה"], answer: "לא נפלתי." },
      { keywords: ["תרופות"], answer: "לוקחת אקסארלטו... פרפור פרוזדורים." }
    ],
    treatments: {
      correct: [
        { name: "חמצן לפי סטורציה", keywords: ["חמצן"], rationale: "לא להיפראוקסיה - יעד 94-98%." },
        { name: "הרמת ראש 30°", keywords: ["ראש", "מורם"], rationale: "מפחית ICP." },
        { name: "ALS דחוף למרכז שבץ", keywords: ["ALS", "שבץ"], rationale: "CT מיידי + נוירוכירורגיה זמינה." }
      ],
      contraindicated: [
        { name: "אספירין", keywords: ["אספירין"], reason: "אסור בשבץ המורגי - מעצים דימום!" },
        { name: "השכבה שטוחה", keywords: ["שטוח"], reason: "מעלה ICP." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 למרכז שבץ (Stroke Center)", correct: true, explanation: "צריך CT מיידי + נוירוכירורגיה. חלון קריטי." },
        { label: "BLS לבית חולים הקרוב", correct: false, explanation: "צריך מרכז שבץ עם נוירוכירורגיה זמינה 24/7." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+הגעה. 3. XABCDE - Cushing (55+220), אישונים אניזוקוריים, GCS יורד. 4. מדדים חמורים. 5. כאב 'הכי חזק בחיים' + הקאות + אקסארלטו = SAH/ICH. 6. חמצן, ראש מורם 30°, אין אספירין! 7. ALS קוד 3 למרכז שבץ."
  },

  // ============ 12. Ischemic Stroke (FAST+) ============
  {
    id: "scenario-ischemic-stroke",
    title: "שבץ איסכמי - FAST חיובי",
    topic: "נוירולוגי",
    difficulty: 2,
    emoji: "🧠",
    dispatch: { text: "מוקד. אדון בן 68 עם חולשה בצד ימין של הגוף ודיבור לא ברור. הבת דיווחה שראתה אותו במצב הזה לפני 45 דקות.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האדון יושב בכיסא, פנים אסימטריות (זווית שמאלית של הפה נופלת), זרוע ימין רפויה, מדבר בקושי. הבת חרדה.", hazards: ["חלון זמן קריטי"], safetyChecklist: [{ label: "PPE + הגעה", keywords: ["ווסט", "הגעה"], critical: true }, { label: "ALS למרכז שבץ", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, דיבור לא ברור אך מגיב." },
      b: { check: "נשימה", keywords: ["B"], finding: "18, סטורציה 96%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 78 לא סדיר (פרפור?), ל\"ד 175/95." },
      d: { check: "הכרה + FAST", keywords: ["D", "FAST"], finding: "Alert. Face - צניחת פה שמאל. Arm - זרוע ימין נופלת. Speech - מבליע מילים. סוכר 108.", criticalAction: "FAST+ = פינוי דחוף!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "175/95", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "78 לא סדיר", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "18" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "96%" },
      { name: "סוכר", keywords: ["סוכר"], value: "108" }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל", "LKW"], answer: "(הבת) ראיתי אותו טוב לאחרונה לפני שעה, ישן. מצאתי אותו ככה לפני 45 דק'." },
      { keywords: ["תרופות", "מדללי דם"], answer: "(הבת) אקסארלטו לפרפור." },
      { keywords: ["רקע"], answer: "(הבת) יתר לחץ דם, פרפור פרוזדורים." },
      { keywords: ["כאב ראש"], answer: "לא." },
      { keywords: ["הקאה"], answer: "לא." }
    ],
    treatments: {
      correct: [
        { name: "חמצן לפי צורך (רק אם <94%)", keywords: ["חמצן"], rationale: "כאן 96% - לא לתת." },
        { name: "השכבה עם ראש מורם 30°", keywords: ["ראש", "מורם"], rationale: "אופטימלי לפרפוזיה מוחית." },
        { name: "ALS דחוף למרכז שבץ", keywords: ["ALS", "שבץ"], rationale: "חלון tPA = 4.5 שעות מ-LKW. עדיין בפוטנציאל." }
      ],
      contraindicated: [
        { name: "אספירין", keywords: ["אספירין"], reason: "לא לפני CT - אם המורגי יגרום נזק." },
        { name: "השכבה שטוחה", keywords: ["שטוח"], reason: "פחות אופטימלי." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 למרכז שבץ - Stroke Alert", correct: true, explanation: "LKW ברור, בחלון tPA. הודעה מוקדמת לחדר CT." },
        { label: "BLS - לא דחוף", correct: false, explanation: "Time is Brain! כל דקה = 1.9 מיליון תאי מוח." }
      ]
    },
    modelResponse: "1. קליטה+ALS מיידי. 2. PPE+הגעה. 3. XABCDE - FAST+ (Face, Arm, Speech). 4. מדדים: LKW 45 דק'. 5. אקסארלטו ברקע, פרפור. 6. ראש 30°, אין חמצן, אין אספירין. 7. ALS קוד 3 למרכז שבץ, Stroke Alert."
  },

  // ============ 13. DKA ============
  {
    id: "scenario-dka",
    title: "סוכרתי בקטואצידוזיס - DKA",
    topic: "מטבולי",
    difficulty: 2,
    emoji: "🍬",
    dispatch: { text: "מוקד. בחור בן 22, סוכרתי מסוג 1, בהקאות מהיום, מבולבל, נשימה מוזרה. אמא בבית.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הבחור במיטתו, נראה חמור, פנים חיוורות ויבשות, נושם עמוק ומהיר (Kussmaul). ריח פירותי מהפה. מבולבל.", hazards: ["התייבשות חמורה"], safetyChecklist: [{ label: "PPE + הגעה", keywords: ["ווסט"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, שפתיים יבשות סדוקות." },
      b: { check: "נשימה", keywords: ["B"], finding: "36 עמוקה (Kussmaul), סטורציה 99%, ריח פירותי חזק." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130, ל\"ד 95/60, עור יבש+חם, CRT 4 שניות." },
      d: { check: "הכרה + סוכר", keywords: ["D", "סוכר"], finding: "V (מבולבל, מגיב לקול). סוכר: HIGH (מעל 600 בגלוקומטר)!", criticalAction: "סוכר גבוה קיצוני!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "עור יבש. אין חבלה. חום 38.5." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "95/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "36 עמוקה", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "99%" },
      { name: "סוכר", keywords: ["סוכר"], value: "HIGH >600", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "(אמא) יומיים לא הרגיש טוב, מהבוקר הקאות." },
      { keywords: ["אינסולין"], answer: "(אמא) לוקח פעמיים ביום, אבל בגלל ההקאות לא הצליח היום." },
      { keywords: ["שתייה", "שתן"], answer: "(אמא) שתה הרבה, השתין הרבה, ואז הפסיק לגמרי." },
      { keywords: ["חום", "מחלה"], answer: "(אמא) יש לו חום. חשבנו וירוס." }
    ],
    treatments: {
      correct: [
        { name: "השכבה בטוחה, ראש מוגן", keywords: ["השכבה"], rationale: "מבולבל - סכנת אספירציה." },
        { name: "חמצן לפי סטורציה", keywords: ["חמצן"], rationale: "כאן 99% - לא צריך." },
        { name: "ALS דחוף - נוזלים IV חיוניים", keywords: ["ALS", "נוזלים"], rationale: "התייבשות עצומה. נוזלים IV + אינסולין מצילים חיים." }
      ],
      contraindicated: [
        { name: "מתן אינסולין ע\"י חובש", keywords: ["אינסולין"], reason: "לא בסמכות + סיכון להיפוגליקמיה + היפוקלמיה חמורה." },
        { name: "שתייה מרובה", keywords: ["שתייה"], reason: "מבולבל = סיכון אספירציה." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - נוזלים בדרך", correct: true, explanation: "DKA = מסכן חיים. צריך נוזלים 1-2L IV מיד + אינסולין בבי\"ח." },
        { label: "BLS - לתת לו מים", correct: false, explanation: "אספירציה + לא מספיק." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+הגעה. 3. XABCDE - Kussmaul, פירותי, HIGH. 4. מדדים: 95/60+130+36+HIGH. 5. סוכרתי T1, הקאות מנעו אינסולין, פוליוריה→אוליגוריה, חום. 6. השכבה בטוחה, נוזלים ALS. 7. ALS קוד 3."
  },

  // ============ 14. Severe Hypoglycemia ============
  {
    id: "scenario-hypoglycemia",
    title: "היפוגליקמיה חמורה - חוסר הכרה",
    topic: "מטבולי",
    difficulty: 1,
    emoji: "🍫",
    dispatch: { text: "מוקד. אישה בת 65, סוכרתית, מחוסרת הכרה בבית. בעלה מדווח שלא אכלה בבוקר אחרי הזרקת אינסולין.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האישה שוכבת על הרצפה בסלון, לא מגיבה. עור לח וקר, מזיעה בכבדות. הבעל מסביר שהזריקה אינסולין ב-7 והלכה לחדר השני.", hazards: ["מצב הפיך אם מטופל במהירות"], safetyChecklist: [{ label: "PPE", keywords: ["ווסט"], critical: true }, { label: "הזמנת ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, אך רפוי - סיכון אספירציה.", criticalAction: "שכיבה על צד!" },
      b: { check: "נשימה", keywords: ["B"], finding: "18, סטורציה 96%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 110, ל\"ד 130/80, עור קר וזעה קרה." },
      d: { check: "הכרה + סוכר", keywords: ["D", "סוכר"], finding: "P (מגיבה רק לכאב חזק). סוכר: 32!", criticalAction: "היפוגליקמיה חמורה!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "130/80" },
      { name: "דופק", keywords: ["דופק"], value: "110", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "18" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "96%" },
      { name: "סוכר", keywords: ["סוכר"], value: "32", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה", "אינסולין"], answer: "(בעל) הזריקה 20 יחידות ב-7:00, יצאה לחדר השני, אמרה שהיא חוזרת לאכול. חזרתי אחרי 30 דק' ומצאתי אותה ככה." },
      { keywords: ["רקע"], answer: "(בעל) סוכרת מסוג 2, על אינסולין." },
      { keywords: ["תרופות"], answer: "(בעל) אינסולין וגלוקופאג'." }
    ],
    treatments: {
      correct: [
        { name: "השכבה על צד + פתיחת נתיב אוויר", keywords: ["צד", "שכיבה"], rationale: "מחוסרת הכרה = סיכון אספירציה." },
        { name: "גלוקוג'ל למשטח בין החניך למחי", keywords: ["גלוקוג", "גלוקוזה"], rationale: "בבטיחות - נספג דרך הרירית. לא לתוך הפה!" },
        { name: "חמצן לפי סטורציה", keywords: ["חמצן"], rationale: "SpO2 96% - לא נדרש כרגע." },
        { name: "ALS דחוף - גלוקוזה IV", keywords: ["ALS"], rationale: "D50W = 25 גרם IV = החייאה." }
      ],
      contraindicated: [
        { name: "מים/חטיף לפה", keywords: ["מים", "אכילה"], reason: "מחוסרת הכרה = אספירציה מיידית!" },
        { name: "אינסולין", keywords: ["אינסולין"], reason: "היא כבר במצב חמור מיותר!" }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - גלוקוזה IV", correct: true, explanation: "D50W IV = תיקון מיידי. גם אם התעוררה - צריך פינוי לבירור." },
        { label: "אם התעוררה - שחרור בבית", correct: false, explanation: "היפוגליקמיה עמוקה = סיכון חזרה. חובה פינוי." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+הגעה. 3. XABCDE - A רפוי (צד!), D=P, סוכר 32. 4. מדדים. 5. אינסולין ללא אוכל. 6. צד+גלוקוג'ל בטוח+ALS. 7. ALS קוד 3."
  },

  // ============ 15. Opioid Overdose ============
  {
    id: "scenario-opioid-od",
    title: "מנת יתר אופיאטים",
    topic: "הרעלות",
    difficulty: 2,
    emoji: "💉",
    dispatch: { text: "מוקד. אדון בן 28 נמצא לא מגיב בבית חבר. חשד למנת יתר. החבר במקום.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האדון שוכב על הרצפה, שפתיים כחלחלות, נשימה מאוד איטית ורדודה. אישונים כמו סיכה. סירינגה קרובה. החבר בהיסטריה.", hazards: ["מחט - סיכון דקירה", "משטרה יכולה להיות רלוונטית"], safetyChecklist: [{ label: "PPE + זהירות ממחט", keywords: ["ווסט", "כפפות", "מחט"], critical: true }, { label: "הזמנת ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "סימני עקיצה בזרוע. לא דימום." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "רפוי, ריר בגרון.", criticalAction: "פתיחה + סקשן!" },
      b: { check: "נשימה", keywords: ["B"], finding: "6 לדקה שטחית! סטורציה 78%.", criticalAction: "BVM!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 55, ל\"ד 90/50, עור לח." },
      d: { check: "הכרה + סוכר", keywords: ["D", "סוכר"], finding: "U (לא מגיב). אישונים 1מ\"מ (miotic). סוכר 92." },
      e: { check: "חשיפה", keywords: ["E"], finding: "סימני מחט זרוע שמאל." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "90/50", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "55", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "6", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "78%", abnormal: true },
      { name: "אישונים", keywords: ["אישונים"], value: "1מ\"מ (miotic)", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(חבר) לא יודע... היינו יחד, יצא רגע, חזרתי - ככה." },
      { keywords: ["סמים", "הרואין"], answer: "(חבר) אני לא רוצה לומר... אבל היה משהו." },
      { keywords: ["רקע"], answer: "(חבר) הוא ביחד שנה נקי, זה חוזר." }
    ],
    treatments: {
      correct: [
        { name: "פתיחת נתיב אוויר + BVM", keywords: ["BVM", "אמבו"], rationale: "6 נשימות + 78% = חייב הנשמה." },
        { name: "חמצן 100% דרך BVM", keywords: ["חמצן"], rationale: "SpO2 78% קריטי." },
        { name: "ALS דחוף - נלוקסון", keywords: ["ALS", "נלוקסון"], rationale: "Narcan מבטל את השפעת האופיאט." }
      ],
      contraindicated: [
        { name: "המתנה לראות אם ישתפר", keywords: [], reason: "6 נשימות = חצי מהרף. ייגיע לדום נשימה תוך דקות." },
        { name: "עירור בטלטול", keywords: ["טלטול", "עירור"], reason: "לא יעזור - צריך אנטגוניסט." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - נלוקסון בדרך", correct: true, explanation: "Narcan IN/IV/IM מציל חיים. גם אחרי - צריך בי\"ח כי משך פעולה קצר." },
        { label: "BLS + BVM לבד", correct: false, explanation: "עדיף אם ALS זמין - נלוקסון = החייאה מיידית." }
      ]
    },
    modelResponse: "1. קליטה+ALS+זהירות מחט. 2. PPE. 3. XABCDE - triad קלאסי (6+U+1mm). 4. מדדים חמורים. 5. חשד היסטוריה. 6. BVM+חמצן+ALS. 7. ALS קוד 3."
  },

  // ============ 16. Imminent Delivery ============
  {
    id: "scenario-imminent-delivery",
    title: "לידה מיידית באמבולנס",
    topic: "מיילדות",
    difficulty: 2,
    emoji: "👶",
    dispatch: { text: "מוקד. אישה הריונית בשבוע 39, צירים כל 2 דקות, מים ירדו. הבעל נוהג לבית חולים אבל תקוע בפקק.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "בעל האישה בהתקף חרדה. האישה בכיסא האחורי של הרכב הפרטי, בכיוונו של המוקד. אתם עוצרים לצד. היא צווחת שהיא מרגישה 'שהתינוק יוצא'.", hazards: ["לידה בשטח - צריך ציוד מיילדות"], safetyChecklist: [{ label: "PPE - כפפות, מגן פנים!", keywords: ["ווסט", "כפפות", "מגן"], critical: true }, { label: "הזמנת ALS", keywords: ["ALS"], critical: true }, { label: "פרטיות (סגירת דלתות)", keywords: ["פרטיות"], critical: false }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "מים צלולים ירדו, אין דם משמעותי." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מדברת בקטעים בין צירים." },
      b: { check: "נשימה", keywords: ["B"], finding: "24 מהיר בזמן ציר, סטורציה 98%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 95, ל\"ד 130/80." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert. סוכר 95." },
      e: { check: "חשיפה + בדיקת פרינאום", keywords: ["E", "פרינאום"], finding: "ראש התינוק נראה - Crowning!", criticalAction: "לידה תוך דקות - התכונן!" }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "130/80" },
      { name: "דופק", keywords: ["דופק"], value: "95" },
      { name: "נשימות", keywords: ["נשימות"], value: "24" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "98%" }
    ],
    patientResponses: [
      { keywords: ["הריון", "שבוע"], answer: "שבוע 39. תינוק ראשון!" },
      { keywords: ["צירים", "מתי"], answer: "צירים מלפני 8 שעות, בהתחלה רחוקים, עכשיו כל 2 דק'." },
      { keywords: ["מים"], answer: "המים ירדו לפני שעה, צלולים." },
      { keywords: ["מעקב"], answer: "מעקב תקין, הכל בסדר." },
      { keywords: ["רגישויות", "אלרגיה"], answer: "אין." }
    ],
    treatments: {
      correct: [
        { name: "השכבה עם רגליים מפושקות, ברכיים כפופות", keywords: ["השכבה", "ברכיים"], rationale: "תנוחת לידה קלאסית." },
        { name: "תמיכה בראש התינוק בעת יציאה (לא למשוך!)", keywords: ["תמיכה", "ראש"], rationale: "מונע פציעה." },
        { name: "ניגוב + חימום התינוק מיד", keywords: ["חימום", "ניגוב"], rationale: "יילודים מאבדים חום מהר." },
        { name: "אין לחתוך חבל טבור בחובש", keywords: ["חבל טבור"], rationale: "רק ALS/רופא - קיבוע בעזרת אביזרים סטריליים." }
      ],
      contraindicated: [
        { name: "משיכת התינוק", keywords: ["משיכה"], reason: "פציעת מפרק כתף!" },
        { name: "המתנה למים חמים לרחיצה", keywords: ["רחיצה"], reason: "לא הזמן - חימום קודם." }
      ]
    },
    transport: {
      options: [
        { label: "ALS + פינוי לבי\"ח יולדות לאחר לידה", correct: true, explanation: "אם ילדה - היולדת + התינוק לבי\"ח. חיוני לבדיקת שליה, דימום, בריאות תינוק." },
        { label: "המתנה בדרך", correct: false, explanation: "בעיות אחרי לידה: PPH, אי-יציאת שליה - דחוף!" }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+פרטיות. 3. XABCDE - Crowning! 4. מדדים. 5. שבוע 39, מים ירדו, צירים 2 דק'. 6. השכבה+תמיכה+ניגוב+חימום, אין חיתוך. 7. ALS ליולדות."
  },

  // ============ 17. Suicide Attempt (pills) ============
  {
    id: "scenario-suicide-attempt",
    title: "ניסיון אובדנות - כדורים",
    topic: "פסיכיאטרי",
    difficulty: 2,
    emoji: "💊",
    dispatch: { text: "מוקד. אישה בת 32 בלעה כמות גדולה של כדורים לפני שעה. שכן שמע צעקות וקרא. משטרה בדרך.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האישה שוכבת בסלון, מבולבלת אך בהכרה. קופסאות תרופות ריקות מסביב (Xanax, Bacetamol, Amitriptyline). פתק פרידה על השולחן.", hazards: ["מצב פסיכיאטרי - סיכון פגיעה עצמית", "משטרה בדרך"], safetyChecklist: [{ label: "PPE + זהירות", keywords: ["ווסט"], critical: true }, { label: "המתנה למשטרה אם מסוכנת", keywords: ["משטרה"], critical: true }, { label: "ALS + מרכז רעלים", keywords: ["ALS", "רעלים"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין - לא חתכים." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מדברת." },
      b: { check: "נשימה", keywords: ["B"], finding: "16, סטורציה 97%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 110 סדיר, ל\"ד 110/70." },
      d: { check: "הכרה + סוכר", keywords: ["D", "סוכר"], finding: "V (מבולבלת, אישונים 4מ\"מ תגובה איטית). סוכר 92." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "110/70" },
      { name: "דופק", keywords: ["דופק"], value: "110", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "16" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "97%" }
    ],
    patientResponses: [
      { keywords: ["מה בלעת", "כמה"], answer: "(מבולבלת) הכל שהיה... לא רוצה יותר." },
      { keywords: ["מתי"], answer: "לפני... שעה בערך." },
      { keywords: ["כמות"], answer: "(מסתכלת על הבקבוקים) הכל היה מלא היום בבוקר." },
      { keywords: ["אלכוהול"], answer: "בקבוק יין." },
      { keywords: ["רקע"], answer: "דיכאון... לוקחת Amitriptyline." }
    ],
    treatments: {
      correct: [
        { name: "איסוף אריזות התרופות + פתק", keywords: ["איסוף", "אריזות"], rationale: "חיוני לבי\"ח לזיהוי + חישוב טיפול." },
        { name: "ניטור צמוד - קצב לב, הכרה", keywords: ["ניטור"], rationale: "TCA (Amitriptyline) גורם להפרעות קצב + פרכוסים." },
        { name: "השכבה על צד עם הכנה להקאה", keywords: ["צד"], rationale: "אספירציה = סיכון." },
        { name: "ALS דחוף לחדר מיון", keywords: ["ALS"], rationale: "צריך פחמן פעיל + ניטור לב + פסיכיאטריה." }
      ],
      contraindicated: [
        { name: "גרימת הקאה", keywords: ["הקאה"], reason: "מסוכן - אספירציה. גם TCA - גורם לפרכוסים." },
        { name: "השארתה לבד", keywords: ["לבד"], reason: "סיכון פגיעה חוזרת." }
      ]
    },
    transport: {
      options: [
        { label: "ALS דחוף עם המשטרה + כל התרופות", correct: true, explanation: "TCA+Xanax+פרצטמול = פוטנציאלית קטלני. פסיכיאטרי חובה." },
        { label: "שחרור בבית עם משפחה", correct: false, explanation: "לא! פינוי חובה + פסיכיאטרי + כפייה אם מסרבת." }
      ]
    },
    modelResponse: "1. קליטה+ALS+משטרה. 2. PPE. 3. XABCDE - V, אישונים איטיים. 4. מדדים. 5. Amitriptyline+Xanax+אלכוהול+כמות לא ברורה. 6. איסוף אריזות, ניטור, צד, ALS. 7. ALS + פסיכיאטרי."
  },

  // ============ 18. Anaphylaxis - Bee Sting ============
  {
    id: "scenario-anaphylaxis-bee",
    title: "אנפילקסיס - עקיצת דבורה",
    topic: "נשימה",
    difficulty: 2,
    emoji: "🐝",
    dispatch: { text: "מוקד. גבר בן 40, נעקץ ע\"י דבורה בגן ציבורי. תגובה אלרגית קשה, מתקשה לנשום.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האדם יושב על ספסל בגן, מתקשה לנשום, פנים אדומות ונפוחות, שפתיים מתחילות להתנפח. פריחה על כל הגוף. חברתו עוזרת.", hazards: ["דבורים בסביבה"], safetyChecklist: [{ label: "PPE + זהירות דבורים", keywords: ["ווסט", "דבורים"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין. עוקץ בצוואר." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "שפתיים ולשון נפוחות!", criticalAction: "פוטנציאל לחסימה!" },
      b: { check: "נשימה", keywords: ["B"], finding: "28 מהירה, צפצופים, סטורציה 89%.", criticalAction: "חמצן + ALS!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130, ל\"ד 85/50 (שוק!), עור אדום." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert חרד. סוכר 105." },
      e: { check: "חשיפה", keywords: ["E"], finding: "פריחת urticaria בכל הגוף. עוקץ בצוואר." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "85/50", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "28", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "89%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי"], answer: "לפני 10 דק', ישבתי, פתאום עקיצה." },
      { keywords: ["אלרגיה", "בעבר"], answer: "מעולם לא. אבל פעם היה נפיחות קלה." },
      { keywords: ["אפיפן"], answer: "אין לי." },
      { keywords: ["תרופות"], answer: "כלום." }
    ],
    treatments: {
      correct: [
        { name: "הסרת עוקץ עם ציפורן/כרטיס (לא פינצטה!)", keywords: ["עוקץ", "הסרה"], rationale: "פינצטה סוחטת עוד ארס." },
        { name: "חמצן high-flow", keywords: ["חמצן"], rationale: "SpO2 89%." },
        { name: "השכבה עם רגליים מורמות", keywords: ["רגליים", "השכבה"], rationale: "שוק אנפילקטי - להעלות return venous." },
        { name: "ALS דחוף לאדרנלין IM", keywords: ["ALS", "אדרנלין"], rationale: "0.3 מ\"ג IM בירך = מציל חיים." }
      ],
      contraindicated: [
        { name: "המתנה שיעבור", keywords: [], reason: "אנפילקסיס = מוות תוך דקות ללא אדרנלין!" },
        { name: "אנטיהיסטמין בלבד", keywords: ["אנטיהיסטמין"], reason: "לא מספיק - צריך אדרנלין." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - אדרנלין IM מיידי", correct: true, explanation: "אנפילקסיס = חייבים אדרנלין. גם אחרי - פינוי לבי\"ח (biphasic reaction בעוד שעות)." },
        { label: "BLS בלי אדרנלין", correct: false, explanation: "יגיע כמת. חייב ALS." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+דבורים. 3. XABCDE - A נפוח, B צפצופים+89%, C שוק. 4. מדדים חמורים. 5. אלרגיה חדשה, אין אפיפן. 6. הסרת עוקץ, חמצן, השכבה+רגליים, ALS. 7. ALS קוד 3."
  },

  // ============ 19. CO Poisoning - Multiple Victims ============
  {
    id: "scenario-co-multi",
    title: "הרעלת CO - משפחה שלמה",
    topic: "הרעלות",
    difficulty: 3,
    emoji: "🔥",
    dispatch: { text: "מוקד. שכן קרא - שמע צעקות מדירה סמוכה, אבל עכשיו שקט. חוזק ריח בעליית מדרגות. חורף.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "אתם מגיעים לבניין. עליית המדרגות ריק ריח שריפה מתוק-חמצמץ. הדירה נעולה, ריחות דומה בפנים אחרי כניסה עם המשטרה. 4 אנשים במיטות - לא מגיבים.", hazards: ["CO בסביבה - סיכון קטלני לצוות!"], safetyChecklist: [{ label: "יציאה מיידית + כיבוי אש", keywords: ["יציאה", "כיבוי אש"], critical: true }, { label: "אוורור", keywords: ["חלונות", "אוורור"], critical: true }, { label: "ALS + ARN (רב נפגעים)", keywords: ["ALS", "ARN"], critical: true }, { label: "לא להיכנס בלי ציוד נשימה", keywords: ["ציוד נשימה", "SCBA"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "(אחרי הוצאה החוצה) אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוחים. 2 מגיבים, 2 לא." },
      b: { check: "נשימה", keywords: ["B"], finding: "כולם 20-24. סטורציה 100%! (מטעה - CO)!", criticalAction: "אל תסתמכו על סטורציה!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דפקים מהירים 110-130, עור אדום דובדבן." },
      d: { check: "הכרה", keywords: ["D"], finding: "2 מבוגרים P, 2 ילדים V. סוכר תקין." },
      e: { check: "חשיפה", keywords: ["E"], finding: "כולם לבושים בפיג'מות. אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "משתנה 100-140" },
      { name: "דופק", keywords: ["דופק"], value: "110-130 כולם", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "20-24" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "100% (מטעה!)", abnormal: true },
      { name: "צבע עור", keywords: ["עור", "צבע"], value: "אדום דובדבן", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(המבוגר שער) הצתי דוד חשמלי כי הגז נתקע... הלכנו לישון..." },
      { keywords: ["מכשירים"], answer: "(הבן) יש דוד גז ישן במטבח." }
    ],
    treatments: {
      correct: [
        { name: "הוצאה מהדירה מיידית", keywords: ["הוצאה", "החוצה"], rationale: "מקור הרעל = הדירה. אין טיפול לפני שרחוקים." },
        { name: "חמצן 100% NRB לכולם", keywords: ["חמצן", "NRB"], rationale: "מזרז יציאת CO מהמוגלובין (משעות לדקות)." },
        { name: "ARN + טריאז'", keywords: ["ARN", "טריאז"], rationale: "4 נפגעים = ARN." },
        { name: "ALS + hyperbaric consult", keywords: ["ALS"], rationale: "אולי צריך תא לחץ (hyperbaric)." }
      ],
      contraindicated: [
        { name: "כניסה חוזרת בלי ציוד", keywords: ["חזרה"], reason: "אתם תיפלו כמותם!" },
        { name: "אמון בסטורציה 100%", keywords: [], reason: "CO קושר להמוגלובין - הסטורציה מטעה! צריך CO-oximetry." }
      ]
    },
    transport: {
      options: [
        { label: "כל ה-4 לבי\"ח עם תא לחץ", correct: true, explanation: "CO חמור = תא לחץ תוך שעות. גם ילדים לא סימפטומטיים - סיכון פוסט-אנוקסי." },
        { label: "רק המבוגרים המחוסרים", correct: false, explanation: "ילדים חשופים = חובה פינוי גם אם מגיבים." }
      ]
    },
    modelResponse: "1. קליטה+ARN+ALS. 2. PPE+יציאה!+אוורור+כיבוי אש. 3. XABCDE אחרי הוצאה - סטורציה מטעה! 4. מדדים. 5. דוד גז ישן. 6. חמצן 100% לכולם + טריאז'. 7. כל ה-4 לתא לחץ."
  },

  // ============ 20. Pediatric Meningitis ============
  {
    id: "scenario-peds-meningitis",
    title: "מנינגוקוקצמיה - ילד עם פריחה",
    topic: "ילדים",
    difficulty: 3,
    emoji: "👶",
    dispatch: { text: "מוקד. הורים - ילדה בת 4 עם חום גבוה מיום אתמול, היום מנומנמת מאוד ופריחה חדשה על הרגליים.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הילדה על הספה, אמה מחזיקה אותה. חיוורת ונומרית. פריחה סגולה קטנה על הרגליים והבטן שלא נעלמת בלחיצה. הורים בפאניקה.", hazards: ["פוטנציאל מנינגיטיס - מדבק לצוות עד 24 שעות טיפול"], safetyChecklist: [{ label: "PPE + מסיכת פנים!", keywords: ["ווסט", "כפפות", "מסיכה"], critical: true }, { label: "ALS דחוף", keywords: ["ALS"], critical: true }, { label: "חשד למחלה מדבקת - דיווח מוקדם", keywords: ["מדבקת", "בי\"ח"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין. פריחה petechial - סגולה, לא נעלמת." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, בוכה חלש." },
      b: { check: "נשימה", keywords: ["B"], finding: "35 מהיר, סטורציה 94%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 165 חלש, ל\"ד 75/45 (שוק ספטי!), CRT 5 שניות!", criticalAction: "שוק ספטי!" },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מגיבה לקול, מיובשת), אישונים תקינים. סוכר 88." },
      e: { check: "חשיפה + פריחה", keywords: ["E", "פריחה"], finding: "פריחת petechiae/purpura בגפיים ובטן. חום 39.8." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "75/45", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "165 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "35", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "94%", abnormal: true },
      { name: "חום", keywords: ["חום"], value: "39.8", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "(אמא) חום מאתמול בבוקר, נתנו אקמול. היום כבר לא רוצה לשתות, כל הזמן ישנה." },
      { keywords: ["פריחה"], answer: "(אמא) הופיעה לפני שעתיים. אמרו לי לבדוק עם כוס - לא נעלמת." },
      { keywords: ["חיסונים"], answer: "(אמא) הכל לפי לוח." },
      { keywords: ["השתנה"], answer: "(אמא) לא השתינה כמעט מהבוקר." }
    ],
    treatments: {
      correct: [
        { name: "מסיכת פנים לצוות", keywords: ["מסיכה"], rationale: "מנינגיטיס מנינגוקוקלי = מדבק דרך דרכי אוויר." },
        { name: "חמצן NRB", keywords: ["חמצן"], rationale: "שוק ספטי - צריך חמצן." },
        { name: "השכבה עם רגליים מורמות", keywords: ["רגליים", "השכבה"], rationale: "שוק." },
        { name: "ALS קוד 3 - נוזלים IV חיוניים", keywords: ["ALS", "נוזלים"], rationale: "20 מ\"ל/ק\"ג נוזלים = מציל חיים בסטטוס ספטי." }
      ],
      contraindicated: [
        { name: "המתנה לראות אם משתפרת", keywords: [], reason: "מנינגוקוק = מוות תוך שעות!" },
        { name: "פנצטמול בלבד", keywords: ["פנצטמול"], reason: "החום הוא לא הבעיה, השוק הספטי הוא." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 לפדיאטריה עם דיווח מקדים", correct: true, explanation: "מנינגוקוק חשוד = דיווח לבי\"ח לחדר בידוד + אנטיביוטיקה IV מיידית." },
        { label: "BLS - חכה שיהיה יציב", correct: false, explanation: "לא ייצב בלי אנטיביוטיקה + נוזלים IV. כל דקה!" }
      ]
    },
    modelResponse: "1. קליטה+ALS+מסיכה. 2. PPE מלא+דיווח בי\"ח. 3. XABCDE - שוק, פריחה petechial. 4. מדדים חמורים ילדותיים. 5. חום, פריחה סגולה, אוליגוריה. 6. חמצן+רגליים+ALS. 7. ALS קוד 3 פדיאטריה."
  },

  // ============ 21. Croup - Toddler ============
  {
    id: "scenario-croup",
    title: "קרופ בפעוט - סטרידור לילי",
    topic: "ילדים",
    difficulty: 2,
    emoji: "🌡️",
    dispatch: { text: "מוקד. הורים - פעוט בן שנתיים, שיעול נובח וקושי נשימה מהחצות. אמה בפאניקה.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הפעוט בזרועות אמו, שיעול 'נובח' חזק, סטרידור בהשראה, נראה נבהל אך מגיב. עור ורוד. אמא היסטרית.", hazards: ["מצב חמור אך צריך גישה רגועה"], safetyChecklist: [{ label: "PPE + רגוע!", keywords: ["ווסט"], critical: true }, { label: "לא לגרום להיסטריה - החמרה", keywords: ["רגוע"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "סטרידור בהשראה, שיעול נובח.", criticalAction: "אל תבחן את הפה - יגרום ל-Spasm!" },
      b: { check: "נשימה", keywords: ["B"], finding: "40 מהיר, שרירי עזר, סטורציה 94%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 160, עור ורוד וחם." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert אך נבהל. סוכר 95." },
      e: { check: "חשיפה", keywords: ["E"], finding: "חום 38.5. אין חבלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "95/60" },
      { name: "דופק", keywords: ["דופק"], value: "160", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "40", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "94%", abnormal: true },
      { name: "חום", keywords: ["חום"], value: "38.5", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "(אמא) התחיל היום בבוקר עם צינון, בלילה שיעול נובח והוא נחנק." },
      { keywords: ["חיסונים"], answer: "(אמא) לפי לוח." },
      { keywords: ["רוק", "חיל"], answer: "(אמא) לא, בולע בסדר." }
    ],
    treatments: {
      correct: [
        { name: "החזק את הילד באמו - לא להפריד", keywords: ["אמא", "מחזיקה"], rationale: "הפרדה = היסטריה = החמרה." },
        { name: "חמצן blow-by (לא מסיכה!)", keywords: ["חמצן", "blow-by"], rationale: "מסיכה מפחידה - Blow-by מקיף אווירה." },
        { name: "רגוע ולא מדבר בקולות חזקים", keywords: ["רגוע"], rationale: "חרדה = פחות אוויר." },
        { name: "ALS - אדרנלין אינהלציה", keywords: ["ALS"], rationale: "Nebulized epinephrine מוריד בצקת." }
      ],
      contraindicated: [
        { name: "בדיקת גרון עם spatula", keywords: ["גרון", "בדיקה", "spatula"], reason: "יכול לגרום לספזם ולסגירת נתיב האוויר!" },
        { name: "הפרדה מהאם", keywords: ["הפרדה"], reason: "היסטריה = החמרת מצב." }
      ]
    },
    transport: {
      options: [
        { label: "ALS לפדיאטריה בישיבה אצל אמא", correct: true, explanation: "רגוע + חמצן + אולי אדרנלין nebulized." },
        { label: "BLS מהיר עם מסיכה חזקה", correct: false, explanation: "מסיכה = פחד = החמרה." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+רגוע. 3. XABCDE - סטרידור, אל תבחן פה. 4. מדדים ילדותיים. 5. צינון היום, נובח בלילה. 6. אמא, blow-by, ALS. 7. ALS פדיאטריה."
  },

  // ============ 22. Foreign Body Aspiration - Toddler ============
  {
    id: "scenario-fba-toddler",
    title: "שאיפת גוף זר - פעוט",
    topic: "ילדים",
    difficulty: 2,
    emoji: "🥜",
    dispatch: { text: "מוקד. הורים - ילד בן 3 שנחנק מבוטן, לא נושם, אמה מנסה לעזור. שכן קרא.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "אמא מחזיקה את הילד רפוי, סגול-אפור, לא בוכה. סימני התנקות עצמית שנכשלה. אמא בהיסטריה. אבא בגן שכן.", hazards: ["חסימה מלאה - מסכן חיים!"], safetyChecklist: [{ label: "PPE", keywords: ["ווסט"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "חסימה מלאה - לא זזה חזה!", criticalAction: "5 טפיחות + 5 עיסויי חזה!" },
      b: { check: "נשימה", keywords: ["B"], finding: "אין תנועת חזה." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 60 חלש (ברדיקרדיה מהיפוקסיה)." },
      d: { check: "הכרה", keywords: ["D"], finding: "U (לא מגיב)." },
      e: { check: "חשיפה", keywords: ["E"], finding: "ציאנוזה כללית." }
    },
    vitals: [
      { name: "דופק", keywords: ["דופק"], value: "60 חלש", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "לא ניתן למדוד" },
      { name: "צבע", keywords: ["צבע"], value: "כחול-סגול", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה", "אכל"], answer: "(אמא בבכי) אכל בוטנים, פתאום נחנק, ניסיתי טפיחות ולא יצא." }
    ],
    treatments: {
      correct: [
        { name: "5 טפיחות גב עם ראש למטה", keywords: ["טפיחות", "גב"], rationale: "ילד גדול (>1 שנה) - טפיחות + Heimlich עדיין רלוונטיים." },
        { name: "5 דחיפות בטן (Heimlich) לילד מעל שנה", keywords: ["Heimlich", "בטן"], rationale: "ילד מעל שנה = Heimlich." },
        { name: "אם נכשל - CPR עם בדיקה חוזרת בפה", keywords: ["CPR", "פה"], rationale: "עיסויים יוצרים לחץ - הגוף זר יכול לצאת." },
        { name: "ALS דחוף", keywords: ["ALS"], rationale: "אולי צריך Magill forceps + אינטובציה." }
      ],
      contraindicated: [
        { name: "אצבע עיוורת בפה", keywords: ["אצבע", "עיוור"], reason: "יכול לדחוף עמוק יותר!" },
        { name: "המתנה", keywords: [], reason: "כל שנייה = היפוקסיה מוחית." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 לפדיאטריה", correct: true, explanation: "גם אחרי הצלחה - בי\"ח לבדיקת נזק." },
        { label: "אם הגוף יצא - להישאר", correct: false, explanation: "אולי יש שאריות. אולי היפוקסיה משמעותית." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE. 3. XABCDE - חסימה מלאה! 4. חמור. 5. בוטן. 6. 5 טפיחות + 5 דחיפות + CPR אם צריך. 7. ALS קוד 3."
  },

  // ============ 23. Heat Stroke ============
  {
    id: "scenario-heat-stroke",
    title: "מכת חום - חייל בשטח",
    topic: "סביבה",
    difficulty: 2,
    emoji: "🔥",
    dispatch: { text: "מוקד. חייל התמוטט בזמן מסע רגלי בקיץ, מבולבל, לא מזיע. חברים מנסים לקרר.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "חייל צעיר על הרצפה בצל עץ, פנים אדומות ויבשות, מבולבל, מדבר ללא הקשר. חברים שופכים עליו מים. שעת יום חמה, 38°.", hazards: ["חום סביבתי גבוה"], safetyChecklist: [{ label: "PPE + מים לצוות", keywords: ["ווסט"], critical: true }, { label: "צל + קירור מיידי", keywords: ["צל", "קירור"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מדבר בבלבול." },
      b: { check: "נשימה", keywords: ["B"], finding: "28 מהיר, סטורציה 96%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 140 סדיר, ל\"ד 90/60, עור אדום יבש וחם!", criticalAction: "טמפ' גוף מסכנת חיים!" },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מבולבל, לא זוכר איפה הוא). סוכר 110." },
      e: { check: "חשיפה + טמפ'", keywords: ["E", "חום"], finding: "טמפ' גוף (rectal אם אפשר): 41.2°C!", criticalAction: "מכת חום קלאסית!" }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "90/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "140", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "28", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "96%" },
      { name: "טמפ'", keywords: ["טמפ", "חום"], value: "41.2°C", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(חבר) הלכנו 4 שעות במסע, פתאום התיישב וקרס." },
      { keywords: ["מים", "שתה"], answer: "(חבר) שתה מעט, אמר שאין לו כוח." },
      { keywords: ["רקע"], answer: "(חבר) בריא לחלוטין." }
    ],
    treatments: {
      correct: [
        { name: "הזזה לצל מיידית", keywords: ["צל"], rationale: "הפסקת חשיפה = צעד ראשון." },
        { name: "הסרת בגדים + הרטבה + מאווררים", keywords: ["בגדים", "הרטבה", "מאוורר"], rationale: "אידוי = הקירור היעיל ביותר." },
        { name: "קרח בית שחי, מפשעה, צוואר", keywords: ["קרח", "בית שחי", "מפשעה"], rationale: "כלי דם גדולים סמוך לעור = קירור מהיר." },
        { name: "ALS דחוף - נוזלים IV קרים", keywords: ["ALS", "נוזלים"], rationale: "התייבשות חמורה + פוטנציאל DIC." }
      ],
      contraindicated: [
        { name: "אקמול/נורופן", keywords: ["אקמול", "נורופן"], reason: "לא עוזרים במכת חום - זה לא זיהום, זה כשל תרמורגולציה." },
        { name: "המתנה לאמבולנס נמרץ בשמש", keywords: [], reason: "כל דקה = יותר נזק מוחי." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 עם קירור אקטיבי בדרך", correct: true, explanation: "טמפ' >40 + שינוי הכרה = מכת חום קלאסית. מסכן חיים." },
        { label: "BLS + מים לשתייה", correct: false, explanation: "מבולבל = אספירציה. צריך IV." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+צל. 3. XABCDE - E: טמפ' 41.2°. 4. מדדים חמורים. 5. מסע + התייבשות. 6. צל+הרטבה+קרח+ALS. 7. ALS קוד 3."
  },

  // ============ 24. Severe Hypothermia ============
  {
    id: "scenario-hypothermia",
    title: "היפותרמיה חמורה - מטייל בהרים",
    topic: "סביבה",
    difficulty: 3,
    emoji: "🥶",
    dispatch: { text: "מוקד. מטייל נמצא בשלג באזור החרמון, מחוסר הכרה חלקית, בגדים רטובים. מד\"א חילוץ בדרך.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "המטייל שוכב בשלג, ידיים כחלחלות, שפתיים סגולות. בגדים רטובים ממים+שלג. איטי מאוד בתגובה. טמפ' סביבה -2°.", hazards: ["קור סביבתי", "מדרון חלק"], safetyChecklist: [{ label: "PPE + חימום צוות", keywords: ["ווסט"], critical: true }, { label: "העברה לתא חם", keywords: ["חם"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, נשימה איטית." },
      b: { check: "נשימה", keywords: ["B"], finding: "8 איטית + עמוקה, סטורציה 88%.", criticalAction: "חמצן חמים!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 40 חלש, ל\"ד 90/50, עור קפוא.", criticalAction: "בדוק דופק לפחות 60 שניות - יכול להיות מאוד איטי!" },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מגיב לקול איטי). סוכר 110." },
      e: { check: "חשיפה + טמפ'", keywords: ["E", "טמפ"], finding: "טמפ' rectal: 28.5°C. גפיים קפואות.", criticalAction: "היפותרמיה חמורה!" }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "90/50", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "40 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "8", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "88%", abnormal: true },
      { name: "טמפ'", keywords: ["טמפ", "חום"], value: "28.5°C", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(חבריו) נפל למים קפואים לפני 40 דק'. הוצאנו אותו." },
      { keywords: ["רקע"], answer: "(חבריו) בריא." }
    ],
    treatments: {
      correct: [
        { name: "הסרת בגדים רטובים + עטיפה בשמיכות יבשות", keywords: ["בגדים", "שמיכות"], rationale: "בגדים רטובים = איבוד חום פי 25." },
        { name: "העברה עדינה - סיכון V-fib!", keywords: ["עדין", "עדינות"], rationale: "טלטול לב היפותרמי = פרפור חדרים!" },
        { name: "חמצן חמים אם אפשר", keywords: ["חמצן"], rationale: "SpO2 88% + חימום פנימי." },
        { name: "ALS דחוף - חימום IV חם", keywords: ["ALS"], rationale: "חימום הדרגתי מבפנים. תא לחץ / שאיפת חום." }
      ],
      contraindicated: [
        { name: "חימום מהיר של גפיים", keywords: ["חימום מהיר"], reason: "After-drop: דם קר מהגפיים חוזר ללב = הפרעות קצב!" },
        { name: "מסאז' חוזק", keywords: ["מסאז", "עיסוי"], reason: "יכול לגרום ל-V-fib." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 עם חימום הדרגתי בדרך", correct: true, explanation: "היפותרמיה <30° = מסכן חיים. צריך חימום פנימי בבי\"ח." },
        { label: "המתנה לחימום בשטח", correct: false, explanation: "לא ניתן לחמם מבפנים בשטח. כל דקה - סיכון V-fib." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+חם. 3. XABCDE - זהיר! ל-60 שניות דופק, טמפ' 28.5°. 4. מדדים איטיים. 5. טבע במים קפואים. 6. בגדים יבשים+שמיכות+העברה עדינה+ALS. 7. ALS קוד 3."
  },

  // ============ 25. MVC Major - Entrapment ============
  {
    id: "scenario-mvc-major",
    title: "תאונת דרכים חמורה - לכוד ברכב",
    topic: "טראומה",
    difficulty: 3,
    emoji: "🚗",
    dispatch: { text: "מוקד. תאונת דרכים חזיתית בכביש 6, שני רכבים. נהג לכוד, פגיעה קשה. מכבי אש בדרך לחילוץ. משטרה לחסימה.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "שני רכבים מרוסקים. הנהג ברכב הפרטי לכוד - רגל ביניים לוחצות. פנים מדממות. איירבג פתוח. דלת נעולה. תנועה עוצרת ליד.", hazards: ["תנועה", "נזילת דלק", "רכב לא יציב", "זכוכיות שבורות"], safetyChecklist: [{ label: "PPE + ווסט זוהר", keywords: ["ווסט", "זוהר"], critical: true }, { label: "בטיחות זירה + חסימת תנועה", keywords: ["חסימה", "תנועה"], critical: true }, { label: "מכבי אש לחילוץ", keywords: ["מכבי אש", "חילוץ"], critical: true }, { label: "ALS + טראומה", keywords: ["ALS", "טראומה"], critical: true }, { label: "טריאז' כל הנפגעים", keywords: ["טריאז"], critical: true }] },
    primary: {
      x: { check: "דימום מסיבי", keywords: ["X"], finding: "דימום מהראש+פנים, ברך שמאל מרוסקת עם דימום."  , criticalAction: "לחץ ישיר על ראש!" },
      a: { check: "נתיב אוויר + צוואר", keywords: ["A", "צוואר"], finding: "דם ורוק בפה - זקוק לסקשן. קיבוע צוואר ידני!", criticalAction: "קיבוע C-spine + סקשן!" },
      b: { check: "נשימה", keywords: ["B"], finding: "32 שטחית, סטורציה 91%, כאב בחזה שמאל, קולות נשימה שוננים." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130 מהיר וחלש, ל\"ד 90/60, עור חיוור וקר, CRT 4 שניות." },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מגיב לקול אך מבולבל). אישונים שווים. סוכר 105." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אחרי החילוץ - חבלה בבטן עם חבורה מהחגורה. רגל שמאל מרוסקת." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "90/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "32", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "91%", abnormal: true },
      { name: "GCS", keywords: ["GCS"], value: "12 (E3V4M5)", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(מתקשה) לא זוכר... הכל שחור." },
      { keywords: ["כאב", "איפה"], answer: "הכל כואב... החזה, הרגל, הראש." },
      { keywords: ["מהירות"], answer: "(עד ראייה) נסע 100 קמ\"ש בלי לבלום." },
      { keywords: ["חגור", "חגורה"], answer: "(עד) כן, היה חגור." }
    ],
    treatments: {
      correct: [
        { name: "קיבוע צוואר ידני מיידי", keywords: ["קיבוע", "צוואר"], rationale: "מנגנון חזק = חשד לפגיעת עמ\"ש." },
        { name: "לחץ ישיר על דימום ראש", keywords: ["לחץ", "ישיר", "ראש"], rationale: "X: דימום מסכן חיים ראשון." },
        { name: "חמצן high-flow", keywords: ["חמצן"], rationale: "SpO2 91% + פוטנציאל פגיעת חזה." },
        { name: "המתנה למכבי אש - חילוץ בטוח", keywords: ["מכבי אש", "חילוץ"], rationale: "אסור לחלץ לבד = פוטנציאל פגיעת עמ\"ש." },
        { name: "לוח קשיח + צווארון + ALS דחוף", keywords: ["לוח", "צווארון", "ALS"], rationale: "פוליטראומה = טראומה מרכז 1." }
      ],
      contraindicated: [
        { name: "חילוץ ללא תמיכה", keywords: ["חילוץ", "לבד"], reason: "פוטנציאל פגיעת עמ\"ש = שיתוק." },
        { name: "נוזלים IV מסיביים בשטח", keywords: ["נוזלים", "מסיבי"], reason: "Permissive hypotension - יל\"ד גבוה = דימום יותר." }
      ]
    },
    transport: {
      options: [
        { label: "ALS + מסוק לטראומה מרכז 1", correct: true, explanation: "פוליטראומה חמורה = Level 1 Trauma Center. גם מסוק אם המרחק גדול." },
        { label: "אמבולנס BLS - צריך מהיר", correct: false, explanation: "ALS חיוני - IV, אינטובציה אולי, ניטור." }
      ]
    },
    modelResponse: "1. קליטה+ALS+מכבי אש+משטרה. 2. PPE זוהר+חסימה. 3. XABCDE - X דימום ראש+רגל, קיבוע צוואר, פוליטראומה. 4. מדדים לא יציבים. 5. מנגנון חזק, חגור. 6. קיבוע+לחץ+חמצן+המתנה לחילוץ+ALS. 7. ALS/מסוק לטראומה 1."
  },

  // ============ 26. Fall from Height ============
  {
    id: "scenario-fall-roof",
    title: "נפילה מגובה - פועל בניין",
    topic: "טראומה",
    difficulty: 3,
    emoji: "🏗️",
    dispatch: { text: "מוקד. פועל בניין נפל מגובה 4 מטרים באתר בנייה. לא זז, לא מגיב. עובדים סביבו.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הפועל שוכב על הרצפה מבטון, לא זז. דם מהראש. גפה אחת בזווית לא טבעית. עובדים עומדים סביבו לא יודעים מה לעשות. אתר בנייה עדיין פעיל.", hazards: ["חפצים נופלים", "בטון לא יציב"], safetyChecklist: [{ label: "PPE + קסדה", keywords: ["ווסט", "קסדה"], critical: true }, { label: "עצירת פעילות באתר", keywords: ["עצירה", "פעילות"], critical: true }, { label: "ALS + מסוק אולי", keywords: ["ALS", "מסוק"], critical: true }, { label: "טריאז' - שאר העובדים", keywords: ["טריאז"], critical: false }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "דימום פעיל מהראש (10-15 מ\"ל)." },
      a: { check: "נתיב אוויר + צוואר", keywords: ["A", "צוואר"], finding: "פתוח, אבל לא מגיב.", criticalAction: "קיבוע צוואר!" },
      b: { check: "נשימה", keywords: ["B"], finding: "12 סדירה, סטורציה 95%, קולות תקינים." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 60 סדיר (חשד ל-Cushing!), ל\"ד 180/100.", criticalAction: "Cushing = עלייה בלחץ תוך גולגולתי!" },
      d: { check: "הכרה + GCS", keywords: ["D", "GCS"], finding: "P (מגיב רק לכאב חזק), GCS 6, אישון שמאל 6 ימין 3.", criticalAction: "פגיעת ראש חמורה!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "רגל ימין בזווית - כנראה שבר. חבלה בבטן." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "180/100", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "60 (Cushing!)", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "12" },
      { name: "סטורציה", keywords: ["סטורציה"], value: "95%" },
      { name: "GCS", keywords: ["GCS"], value: "6 (E1V2M3)", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "(עד) נפל מהפיגום, כמעט 4 מטר, הרצפה בטון." },
      { keywords: ["קסדה"], answer: "(עד) לא היה חובש קסדה, לצערי." },
      { keywords: ["הכרה"], answer: "(עד) איבד הכרה מיד." }
    ],
    treatments: {
      correct: [
        { name: "קיבוע צוואר מיידי + לוח קשיח", keywords: ["קיבוע", "לוח"], rationale: "נפילה מגובה = פגיעת עמ\"ש עד שיוכח אחרת." },
        { name: "לחץ על דימום ראש", keywords: ["לחץ", "ראש"], rationale: "X ראשון." },
        { name: "ראש מורם 30° אחרי הקיבוע", keywords: ["ראש", "מורם"], rationale: "אחרי קיבוע - מפחית ICP." },
        { name: "חמצן NRB", keywords: ["חמצן"], rationale: "מוח נפוח - צריך אספקת חמצן מקסימלית." },
        { name: "ALS + מסוק לטראומה 1", keywords: ["ALS", "מסוק"], rationale: "פגיעת ראש חמורה + פוטנציאל אינטובציה מיידית." }
      ],
      contraindicated: [
        { name: "היפרונטילציה מסיבית", keywords: ["היפרונטילציה"], reason: "מפחית CPP - סיכון." },
        { name: "עלייה אנכית מהיר", keywords: ["מהיר"], reason: "מזעזע פגיעת עמ\"ש." }
      ]
    },
    transport: {
      options: [
        { label: "מסוק לטראומה 1 - נוירוכירורגיה זמינה", correct: true, explanation: "פגיעת ראש חמורה = צריך CT + נוירוכירורגיה תוך שעה זהב." },
        { label: "אמבולנס BLS לבי\"ח הקרוב", correct: false, explanation: "חסר יכולות. Golden hour = מסוק אם אפשר." }
      ]
    },
    modelResponse: "1. קליטה+ALS+מסוק. 2. PPE+קסדה+עצירה. 3. XABCDE - Cushing, GCS 6, אישונים לא שווים, קיבוע. 4. מדדים חמורים. 5. נפילה 4מ' ללא קסדה. 6. קיבוע+לחץ+חמצן+ראש 30°+ALS. 7. מסוק לטראומה 1."
  },

  // ============ 27. GSW to Chest ============
  {
    id: "scenario-gsw-chest",
    title: "פצע ירי בחזה",
    topic: "טראומה",
    difficulty: 3,
    emoji: "🩸",
    dispatch: { text: "מוקד. אירוע ירי ברחוב, גבר צעיר עם פצע ירי בחזה. משטרה כבר בזירה, מוודאת בטיחות.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "המשטרה מאשרת בטיחות. הגבר שוכב על הרצפה, פצע כניסה בחזה שמאלי, נשימה מהירה שטחית. חיוור. אין פצע יציאה גלוי. משטרה שומרת.", hazards: ["אחרי אירוע ירי - עוד יורים אפשריים", "ראיות פליליות"], safetyChecklist: [{ label: "PPE + ווסט", keywords: ["ווסט", "בטיחות"], critical: true }, { label: "וידוא בטיחות ממשטרה", keywords: ["משטרה", "בטוח"], critical: true }, { label: "ALS דחוף", keywords: ["ALS"], critical: true }, { label: "שמירת ראיות", keywords: ["ראיות"], critical: false }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "פצע כניסה בחזה שמאלי מעל דד. דימום פעיל." },
      a: { check: "נתיב אוויר + צוואר", keywords: ["A"], finding: "פתוח, מדבר בקטעים." },
      b: { check: "נשימה", keywords: ["B"], finding: "34 מהיר שטחי, סטורציה 84%, אין קולות בצד שמאל, סטיית קנה לימין!", criticalAction: "Tension pneumothorax! Chest seal + מחט!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 140 חלש, ל\"ד 80/50, עור חיוור." },
      d: { check: "הכרה", keywords: ["D"], finding: "V (מתחיל לאבד ריכוז). סוכר 100." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין פצע יציאה. חבלה נוספת בבטן קלה." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "80/50", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "140 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "34", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "84%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מי", "מה קרה"], answer: "(מתקשה) יריו בי... לא יודע." },
      { keywords: ["כאב"], answer: "בחזה... קשה לנשום." },
      { keywords: ["רקע"], answer: "בריא." }
    ],
    treatments: {
      correct: [
        { name: "Chest seal על פצע כניסה", keywords: ["chest seal", "כיסוי"], rationale: "מונע כניסת אוויר נוסף. Vented seal אם אפשר." },
        { name: "חמצן NRB + BVM אם צריך", keywords: ["חמצן"], rationale: "SpO2 84% קריטי." },
        { name: "חיפוש פצע יציאה בגב", keywords: ["גב", "יציאה"], rationale: "לא תמיד גלוי - צריך בדיקת גב." },
        { name: "לחץ ישיר על דימום", keywords: ["לחץ"], rationale: "עצירת דימום מסיבי." },
        { name: "ALS דחוף + מרכז טראומה", keywords: ["ALS", "טראומה"], rationale: "Tension PTX = decompression מחט. Chest tube בבי\"ח." }
      ],
      contraindicated: [
        { name: "הכנסת אצבע לפצע", keywords: ["אצבע", "פצע"], reason: "זיהום + נזק נוסף." },
        { name: "מים על הפצע", keywords: ["מים"], reason: "כיסוי סטרילי בלבד." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 למרכז טראומה 1", correct: true, explanation: "GSW חזה = 'load and go'. Golden 10 minutes." },
        { label: "המתנה לסלוק את הזירה", correct: false, explanation: "אם המשטרה אישרה בטיחות - להעביר מיד." }
      ]
    },
    modelResponse: "1. קליטה+ALS+וידוא משטרה. 2. PPE. 3. XABCDE - Tension PTX! (סטיית קנה). 4. מדדים חמורים. 5. פצע כניסה בלבד. 6. Chest seal+חמצן+בדיקת גב+לחץ+ALS. 7. ALS קוד 3 לטראומה 1."
  },

  // ============ 28. Stab Wound Abdomen ============
  {
    id: "scenario-stab-abdomen",
    title: "פצע דקירה בבטן",
    topic: "טראומה",
    difficulty: 2,
    emoji: "🔪",
    dispatch: { text: "מוקד. תגרה, גבר נדקר בבטן. משטרה בזירה, החושד נמלט. הנפגע בהכרה.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הגבר שוכב על המדרכה, מחזיק את הבטן, גרביים אדומות מדם. סכין עדיין במקום! משטרה מסדרת סביב. אנשים מקיפים.", hazards: ["פוטנציאל חזרת החושד", "המון סקרן"], safetyChecklist: [{ label: "PPE + ווסט", keywords: ["ווסט"], critical: true }, { label: "וידוא בטיחות", keywords: ["בטוח"], critical: true }, { label: "ALS + טראומה", keywords: ["ALS"], critical: true }, { label: "אין להוציא סכין!", keywords: ["סכין", "לא להוציא"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "דם מסביב לסכין. סכין במקום." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מדבר." },
      b: { check: "נשימה", keywords: ["B"], finding: "24 מהיר, סטורציה 95%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 115 מהיר, ל\"ד 100/60, עור חיוור." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert. סוכר 100." },
      e: { check: "חשיפה", keywords: ["E"], finding: "סכין ברבע ימני עליון. אין פצעים אחרים גלויים." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "100/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "115", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "24", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "95%" }
    ],
    patientResponses: [
      { keywords: ["מה קרה"], answer: "תגרה בבר... פתאום מצאתי סכין." },
      { keywords: ["כאב"], answer: "כואב חזק פה, ומתפשט." },
      { keywords: ["רגישויות"], answer: "אין." }
    ],
    treatments: {
      correct: [
        { name: "אין להוציא את הסכין!", keywords: ["לא להוציא"], rationale: "הסכין עלולה לחסום כלי דם. הוצאה = דימום מסיבי." },
        { name: "קיבוע הסכין עם תחבושות", keywords: ["קיבוע", "תחבושת"], rationale: "מונע תנועה + החמרת פציעה." },
        { name: "חמצן לפי סטורציה", keywords: ["חמצן"], rationale: "לפי הצורך." },
        { name: "השכבה עם ברכיים כפופות", keywords: ["ברכיים", "כפוף"], rationale: "מפחית מתח על הבטן." },
        { name: "ALS דחוף לטראומה", keywords: ["ALS", "טראומה"], rationale: "צריך ניתוח אקספלורטיבי מיידי." }
      ],
      contraindicated: [
        { name: "הוצאת הסכין!", keywords: ["להוציא", "משוך"], reason: "דימום מסיבי בלתי מבוקר!" },
        { name: "אכילה/שתייה", keywords: ["אוכל", "שתייה"], reason: "לפני ניתוח - NPO." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 לטראומה 1 - סכין מקובעת", correct: true, explanation: "ניתוח דחוף להסרה מבוקרת + תיקון פנימי." },
        { label: "הוצאת סכין לפני העברה", correct: false, explanation: "לעולם לא! הסכין נשארת עד לחדר ניתוח." }
      ]
    },
    modelResponse: "1. קליטה+ALS+משטרה. 2. PPE+וידוא. 3. XABCDE - סכין ב-RUQ. 4. מדדים מוקדמים לשוק. 5. תגרה. 6. **לא להוציא**+קיבוע+חמצן+ברכיים+ALS. 7. ALS קוד 3 לטראומה."
  },

  // ============ 29. Status Epilepticus ============
  {
    id: "scenario-status-epilepticus",
    title: "סטטוס אפילפטיקוס - פרכוס ממושך",
    topic: "נוירולוגי",
    difficulty: 3,
    emoji: "⚡",
    dispatch: { text: "מוקד. אישה בת 45 מפרכסת יותר מ-10 דקות, לא מפסיקה. משפחה בפאניקה, קראה לחוצפה.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האישה על הרצפה בסלון, מפרכסת בכל הגוף, ריר בפה, שפתיים כחלחלות. משפחה עומדת בהלם. פרכסה כבר כשהתקשרו לפני 8 דק'.", hazards: ["סכנה לטלטול חפצים סביב", "אספירציה"], safetyChecklist: [{ label: "PPE + פינוי חפצים", keywords: ["ווסט", "חפצים"], critical: true }, { label: "ALS דחוף - צריך תרופות", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "דם ברוק - נשך לשון." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "מפרכס - א\"א להעריך נכון. שכיבה על צד!", criticalAction: "צד + פתיחה!" },
      b: { check: "נשימה", keywords: ["B"], finding: "פרכוסית, סטורציה 85% (יורדת!)." , criticalAction: "חמצן!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130 מהיר, ל\"ד 160/100." },
      d: { check: "הכרה", keywords: ["D"], finding: "U בזמן פרכוס. סוכר: 45!", criticalAction: "היפוגליקמיה גורמת לפרכוס!" },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה. פרכוס גופני מלא." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "160/100", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "פרכוסית", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "85%", abnormal: true },
      { name: "סוכר", keywords: ["סוכר"], value: "45!", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "(משפחה) לפני 15 דק'! בהתחלה חשבנו שתעצור..." },
      { keywords: ["אפילפסיה", "רקע"], answer: "(משפחה) לא ידוע לנו." },
      { keywords: ["סוכרתית", "סוכרת"], answer: "(משפחה) כן! היא סוכרתית, על אינסולין." },
      { keywords: ["אוכל", "היום"], answer: "(משפחה) לא אכלה טוב היום, אמרה שלא רעבה." }
    ],
    treatments: {
      correct: [
        { name: "שכיבה על צד - מונע אספירציה", keywords: ["צד"], rationale: "בזמן פרכוס - מונע חנק ברוק." },
        { name: "חמצן blow-by / NRB אחרי סיום", keywords: ["חמצן"], rationale: "SpO2 85% - היפוקסיה." },
        { name: "פינוי חפצים מסוכנים סביב", keywords: ["חפצים"], rationale: "מונע פציעה." },
        { name: "בדיקת סוכר מיידית - היפוגליקמיה!", keywords: ["סוכר"], rationale: "45 = סיבה הפיכה לפרכוס. צריך גלוקוזה." },
        { name: "ALS דחוף - בנזודיאזפינים + גלוקוזה", keywords: ["ALS"], rationale: "Diazepam / Midazolam לעצור פרכוס. D50W לסוכר." }
      ],
      contraindicated: [
        { name: "החזקת האישה בכוח", keywords: ["החזקה"], reason: "לא עוצרת פרכוס + פוטנציאל שברים." },
        { name: "הכנסת חפץ לפה", keywords: ["חפץ", "פה"], reason: "שבירת שיניים + פציעת גרון!" }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - בנזודיאזפינים בדרך", correct: true, explanation: "SE >5 דק' = מסכן חיים. בנזודיאזפינים IV/IM/IN עוצרים." },
        { label: "המתנה שיסיים לבד", correct: false, explanation: "SE ממושך = מוות תאי מוח + rhabdomyolysis." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+פינוי. 3. XABCDE - סוכר 45! צד! 4. מדדים. 5. סוכרתית ולא אכלה. 6. צד+חמצן+פינוי+ALS. 7. ALS קוד 3 - גלוקוזה+בנזו."
  },

  // ============ 30. COPD Exacerbation ============
  {
    id: "scenario-copd-exacerbation",
    title: "החמרת COPD - קשיש",
    topic: "נשימה",
    difficulty: 2,
    emoji: "💨",
    dispatch: { text: "מוקד. גבר בן 72 עם COPD ידוע, החמרה של קוצר נשימה מ-3 ימים, היום קשה מאוד. בבית.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "הגבר יושב בכיסא נוח, מדבר במילה-שתיים בין נשיפות. שפתיים ורדרדות (עדיין). נשימה עם 'pursed lips'. שיעול עם ליחה ירקרקה.", hazards: ["מטופל היפוקסי כרוני"], safetyChecklist: [{ label: "PPE + הגעה", keywords: ["ווסט"], critical: true }, { label: "ALS", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, ליחה ירקרקה." },
      b: { check: "נשימה", keywords: ["B"], finding: "28 קשה, צפצופים + wheeze בכל השדות, סטורציה 86%, שרירי עזר." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 115, ל\"ד 150/95, עור חמים." },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert. סוכר 130." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה. חום 38.2." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "150/95", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "115", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "28", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "86%", abnormal: true },
      { name: "חום", keywords: ["חום"], value: "38.2", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "3 ימים... הלך והחמיר." },
      { keywords: ["רקע", "COPD"], answer: "COPD 15 שנה, מעשן 40 שנה." },
      { keywords: ["תרופות"], answer: "משאף בנטולין ואטרובנט. סימביקורט." },
      { keywords: ["ליחה"], answer: "ירקרקה, יותר מרגיל." },
      { keywords: ["חום"], answer: "תחושת חום, לא מדדתי." }
    ],
    treatments: {
      correct: [
        { name: "חמצן ניתן! (יעד 88-92%)", keywords: ["חמצן", "88"], rationale: "COPD - יעד סטורציה 88-92% (לא >94%). NC 2-4 ליטר." },
        { name: "ישיבה זקופה", keywords: ["ישיבה"], rationale: "מקסים ריאות." },
        { name: "ונטולין + אטרובנט nebulized", keywords: ["ונטולין"], rationale: "מרחיבי סמפונות." },
        { name: "ALS - CPAP אם קיים", keywords: ["ALS", "CPAP"], rationale: "CPAP מוריד עבודת נשימה משמעותית." }
      ],
      contraindicated: [
        { name: "חמצן high-flow (100%)", keywords: ["100%", "high-flow"], reason: "COPD chronic = יכול לגרום ל-CO2 narcosis." },
        { name: "השכבה שטוחה", keywords: ["שטוח"], reason: "מחמיר קוצר נשימה." }
      ]
    },
    transport: {
      options: [
        { label: "ALS לחדר מיון + חשד ל-COPD exacerbation + פנאומוניה", correct: true, explanation: "חום + ליחה ירקרקה = מרכיב זיהומי. צריך אנטיביוטיקה + סטרואידים IV." },
        { label: "המתנה שהמצב ישתפר", correct: false, explanation: "לא ישתפר לבד - זיהום שדורש טיפול IV." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE. 3. XABCDE - יעד 88-92%! 4. מדדים. 5. COPD ידוע, חום, ליחה ירקרקה. 6. חמצן מבוקר+ישיבה+ונטולין+ALS. 7. ALS."
  },

  // ============ 31. Bronchiolitis - Infant ============
  {
    id: "scenario-bronchiolitis",
    title: "ברונכיוליטיס - תינוק",
    topic: "ילדים",
    difficulty: 2,
    emoji: "🍼",
    dispatch: { text: "מוקד. תינוק בן 4 חודשים עם קוצר נשימה, לא אוכל. אמו בפאניקה. חורף.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "תינוקת קטנה בזרועות אמה, נושמת מהר עם הצלעות שנכנסות פנימה בכל נשימה (retractions). שיעול קטן. לא רוצה לאכול. חיוורת.", hazards: ["גיל צעיר - פוטנציאל דום נשימה"], safetyChecklist: [{ label: "PPE + מסיכה (RSV)", keywords: ["ווסט", "מסיכה"], critical: true }, { label: "ALS פדיאטרי", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, ריר מהאף." },
      b: { check: "נשימה", keywords: ["B"], finding: "70 מהיר!, retractions בין הצלעות + סטרנום, סטורציה 89%, wheezing.", criticalAction: "מצוקה נשימתית!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 170, עור חיוור אך חם." },
      d: { check: "הכרה", keywords: ["D"], finding: "רגזני אך מגיב. סוכר 90." },
      e: { check: "חשיפה", keywords: ["E"], finding: "חום 37.8." }
    },
    vitals: [
      { name: "דופק", keywords: ["דופק"], value: "170", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "70", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "89%", abnormal: true },
      { name: "חום", keywords: ["חום"], value: "37.8", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי", "התחיל"], answer: "(אמא) יומיים צינון, מהבוקר קשה לה לנשום." },
      { keywords: ["אוכל"], answer: "(אמא) יונקת רק קצת, מתעייפת." },
      { keywords: ["חיסונים"], answer: "(אמא) לפי לוח." },
      { keywords: ["בעבר"], answer: "(אמא) בריאה." }
    ],
    treatments: {
      correct: [
        { name: "חמצן blow-by לתינוקת", keywords: ["חמצן", "blow-by"], rationale: "מסיכה מפחידה - blow-by עדיף." },
        { name: "סקשן עדין באף אם צריך", keywords: ["סקשן"], rationale: "ריר חוסם - סקשן עדין יכול לעזור." },
        { name: "בזרועות אמא, ישיבה קלה", keywords: ["אמא", "ישיבה"], rationale: "רגוע + זקוף מקל על נשימה." },
        { name: "ALS פדיאטרי", keywords: ["ALS"], rationale: "פוטנציאל אינטובציה בתינוק חמור." }
      ],
      contraindicated: [
        { name: "אלבוטרול", keywords: ["ונטולין"], reason: "לא עוזר בברונכיוליטיס RSV (בעיקר במטופלי אסטמה)." },
        { name: "הפרדה מאמא", keywords: ["הפרדה"], reason: "בכי = מחמיר נשימה." }
      ]
    },
    transport: {
      options: [
        { label: "ALS פדיאטרי לבי\"ח ילדים", correct: true, explanation: "תינוקת <6 חודשים + סטורציה 89% + retractions = אשפוז." },
        { label: "המתנה בבית", correct: false, explanation: "פוטנציאל דום נשימה בגיל הזה." }
      ]
    },
    modelResponse: "1. קליטה+ALS+מסיכה. 2. PPE. 3. XABCDE - RR 70, retractions, 89%. 4. מדדים. 5. RSV bronchiolitis. 6. blow-by+סקשן+אמא+ALS. 7. ALS פדיאטרי."
  },

  // ============ 32. Postpartum Hemorrhage ============
  {
    id: "scenario-pph",
    title: "דימום פוסט-לידתי",
    topic: "מיילדות",
    difficulty: 3,
    emoji: "🩸",
    dispatch: { text: "מוקד. אישה בת 32 ילדה בבית לפני 45 דקות בלידת בית מתוכננת עם מיילדת. דימום כבד. המיילדת עזבה כי חשבה שהכל תקין.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האישה על מיטה עם התינוקת (בריאה) בזרועות בעלה. עדיין דימום פעיל מהנרתיק, סדין ספוג בדם. חיוורת, מבולבלת קלות.", hazards: ["דימום נסתר משמעותי"], safetyChecklist: [{ label: "PPE מלא + מגן פנים", keywords: ["ווסט", "מגן"], critical: true }, { label: "ALS דחוף", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "דימום נרתיקי פעיל, כ-1.5 ליטר אבודים." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פתוח, מגיבה." },
      b: { check: "נשימה", keywords: ["B"], finding: "24, סטורציה 96%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 130 חלש, ל\"ד 90/60 (יורד), עור חיוור וקר, CRT 4.", criticalAction: "שוק היפוולמי!" },
      d: { check: "הכרה", keywords: ["D"], finding: "Alert אך חלשה. סוכר 100." },
      e: { check: "חשיפה + בטן", keywords: ["E", "בטן"], finding: "רחם רך (Boggy) - לא מתכווץ.", criticalAction: "Uterine atony!" }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "90/60", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "130 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "24", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "96%" },
      { name: "דימום מוערך", keywords: ["דימום"], value: "1.5 ליטר", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["הלידה"], answer: "לפני 45 דק', תינוקת בריאה, בלי בעיה." },
      { keywords: ["שליה", "יצאה"], answer: "כן, יצאה שלמה." },
      { keywords: ["דימום", "מתי"], answer: "התחיל אחרי שהמיילדת עזבה, לפני 15 דק'." },
      { keywords: ["הריון", "מספר"], answer: "לידה חמישית." }
    ],
    treatments: {
      correct: [
        { name: "עיסוי רחם דרך הבטן (Fundal massage)", keywords: ["עיסוי", "רחם", "fundal"], rationale: "מגרה כיווץ הרחם - עוצר דימום." },
        { name: "רגליים מורמות + השכבה", keywords: ["רגליים"], rationale: "מגביר return venous במקרה של שוק." },
        { name: "חמצן NRB", keywords: ["חמצן"], rationale: "לא כי סטורציה - כי איבוד דם משמעותי." },
        { name: "האכלה מיידית אם אפשר - הפרשת אוקסיטוצין", keywords: ["האכלה", "יניקה"], rationale: "יניקה = משחרר אוקסיטוצין = מכווץ רחם." },
        { name: "ALS דחוף - אוקסיטוצין IV", keywords: ["ALS", "אוקסיטוצין"], rationale: "פיטוצין IV מציל חיים." }
      ],
      contraindicated: [
        { name: "המתנה שיעצור", keywords: [], reason: "PPH הוא סיבת מוות אימהי #1 בעולם. כל דקה!" },
        { name: "עמידה", keywords: ["עמידה", "הליכה"], reason: "מחמיר שוק." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 ליולדות + עיסוי בדרך", correct: true, explanation: "PPH = חייבים אוקסיטוצין + אולי דם. עיסוי מתמשך בדרך." },
        { label: "המתנה שהמיילדת תחזור", correct: false, explanation: "אין זמן!" }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE מלא. 3. XABCDE - X דימום, C שוק, E רחם רך. 4. מדדים לא יציבים. 5. לידה 5, שליה יצאה, דימום מאוחר. 6. עיסוי fundal+רגליים+חמצן+האכלה+ALS. 7. ALS קוד 3 ליולדות."
  },

  // ============ 33. Eclampsia ============
  {
    id: "scenario-eclampsia",
    title: "אקלמפסיה - פרכוס בהריון",
    topic: "מיילדות",
    difficulty: 3,
    emoji: "🤰",
    dispatch: { text: "מוקד. אישה בשבוע 34 להריון, בעל דיווח על התקף פרכוס פתאומי. יל\"ד ידוע בהריון.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האישה בעיצומו של פרכוס טונו-קלוני על הרצפה בסלון. הבעל בהלם. בטן גדולה בולטת. פרכוס מאט לאחר 3 דק'.", hazards: ["פרכוס בהריון מסכן אם ועובר"], safetyChecklist: [{ label: "PPE + פינוי חפצים", keywords: ["ווסט"], critical: true }, { label: "ALS + יולדות דחוף", keywords: ["ALS"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין כרגע. לשון נשוכה." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "פרכוס - פתיחה אחרי סיום.", criticalAction: "צד שמאל!" },
      b: { check: "נשימה", keywords: ["B"], finding: "אחרי פרכוס: 22, סטורציה 92%." },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 100, ל\"ד 180/110!", criticalAction: "יל\"ד חמור!" },
      d: { check: "הכרה", keywords: ["D"], finding: "פוסט-איקטלית, מבולבלת. סוכר 105." },
      e: { check: "חשיפה + בטן הריון", keywords: ["E", "בטן"], finding: "בטן הריון של שבוע 34. בצקות ברגליים." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "180/110", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "100" },
      { name: "נשימות", keywords: ["נשימות"], value: "22", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "92%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["הריון", "שבוע"], answer: "(בעל) שבוע 34. הריון ראשון." },
      { keywords: ["יל\"ד", "לחץ דם"], answer: "(בעל) המעקב אמר שיש לה יל\"ד הריוני, על טיפול." },
      { keywords: ["פרכוס", "בעבר"], answer: "(בעל) מעולם לא. פתאום התחילה לרעוד." },
      { keywords: ["תרופות"], answer: "(בעל) לביטריו ל-BP." }
    ],
    treatments: {
      correct: [
        { name: "השכבה על צד שמאל (LLD)", keywords: ["צד שמאל", "LLD"], rationale: "מונע לחץ על Vena Cava - מגביר פרפוזיה לעובר." },
        { name: "חמצן NRB", keywords: ["חמצן"], rationale: "מגן על העובר + האם." },
        { name: "פינוי חפצים סביב", keywords: ["חפצים"], rationale: "מונע פציעה." },
        { name: "ALS קוד 3 - מגנזיום IV חיוני", keywords: ["ALS", "מגנזיום"], rationale: "מגנזיום סולפט IV = טיפול בחירה לאקלמפסיה." }
      ],
      contraindicated: [
        { name: "השכבה על גב", keywords: ["גב"], reason: "לחץ על Vena Cava = הפחתת פרפוזיה." },
        { name: "בנזודיאזפינים ללא מגנזיום", keywords: ["בנזו"], reason: "מגנזיום קודם - יעיל יותר באקלמפסיה." }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 ליולדות דחופה - מגנזיום IV", correct: true, explanation: "אקלמפסיה = שני חולים. צריך מגנזיום + לידה דחופה." },
        { label: "המתנה עד סיום פרכוס", correct: false, explanation: "פרכוס חוזר בקרוב - זמן קריטי." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE+פינוי. 3. XABCDE - צד שמאל! BP 180/110, שבוע 34. 4. מדדים. 5. יל\"ד הריוני. 6. LLD+חמצן+ALS. 7. ALS קוד 3 ליולדות."
  },

  // ============ 34. Tension Pneumothorax ============
  {
    id: "scenario-tension-ptx",
    title: "פנאומותורקס בלחץ",
    topic: "טראומה",
    difficulty: 3,
    emoji: "🫁",
    dispatch: { text: "מוקד. אדון בן 55, קוצר נשימה שהחריף במהירות אחרי שיעול חזק. לא היה טראומה.", acceptKeywords: ["קיבלתי", "בדרך"] },
    scene: { description: "האדון יושב בכיסא, מנסה לנשום, סגול-אפור. עורק צוואר בולט. חצי חזה שמאל לא זז. אשתו בהלה - התדרדר בדקות.", hazards: ["Tension - יורד לדום לב תוך דקות"], safetyChecklist: [{ label: "PPE", keywords: ["ווסט"], critical: true }, { label: "ALS דחוף - decompression!", keywords: ["ALS", "decompression"], critical: true }] },
    primary: {
      x: { check: "דימום", keywords: ["X"], finding: "אין." },
      a: { check: "נתיב אוויר", keywords: ["A"], finding: "סטיית קנה לימין!", criticalAction: "Tension PTX!" },
      b: { check: "נשימה", keywords: ["B"], finding: "40 קשה, אין קולות נשימה בשמאל, hyper-resonance, סטורציה 78%.", criticalAction: "מחט decompression!" },
      c: { check: "מחזור", keywords: ["C"], finding: "דופק 140 חלש, ל\"ד 80/50, JVD (ורידי צוואר נפוחים)." },
      d: { check: "הכרה", keywords: ["D"], finding: "V, מתחיל לאבד הכרה." },
      e: { check: "חשיפה", keywords: ["E"], finding: "אין חבלה. חזה שמאל נראה מוגדל." }
    },
    vitals: [
      { name: "לחץ דם", keywords: ["לחץ דם"], value: "80/50", abnormal: true },
      { name: "דופק", keywords: ["דופק"], value: "140 חלש", abnormal: true },
      { name: "נשימות", keywords: ["נשימות"], value: "40", abnormal: true },
      { name: "סטורציה", keywords: ["סטורציה"], value: "78%", abnormal: true }
    ],
    patientResponses: [
      { keywords: ["מתי"], answer: "(אשה) פתאום, לפני 20 דק', אחרי שיעול חזק." },
      { keywords: ["רקע"], answer: "(אשה) עישן שנים, יש לו COPD." },
      { keywords: ["טראומה"], answer: "(אשה) לא נפל, לא נחבט." }
    ],
    treatments: {
      correct: [
        { name: "חמצן NRB 15L", keywords: ["חמצן"], rationale: "SpO2 78% - קריטי." },
        { name: "ישיבה זקופה אם סובל", keywords: ["ישיבה"], rationale: "מקל." },
        { name: "ALS קוד 3 - מחט decompression חיונית!", keywords: ["ALS", "מחט"], rationale: "Needle thoracostomy = הצלת חיים. חובש לא מוסמך." }
      ],
      contraindicated: [
        { name: "כיסוי חזה", keywords: ["כיסוי"], reason: "לא טראומה - אין פצע פתוח לכסות." },
        { name: "המתנה", keywords: [], reason: "Tension PTX = דום לב תוך דקות!" }
      ]
    },
    transport: {
      options: [
        { label: "ALS קוד 3 - decompression מחט בדרך", correct: true, explanation: "Spontaneous tension PTX ב-COPD. פראמדיק יכול לבצע needle thoracostomy." },
        { label: "BLS - אין מה לעשות", correct: false, explanation: "יגיע כמת. חייבים ALS." }
      ]
    },
    modelResponse: "1. קליטה+ALS. 2. PPE. 3. XABCDE - סטיית קנה, JVD, אין קולות שמאל, 78%. 4. מדדים חמורים. 5. COPD, שיעול חזק. 6. חמצן+ישיבה+ALS דחוף. 7. ALS קוד 3."
  }
];
