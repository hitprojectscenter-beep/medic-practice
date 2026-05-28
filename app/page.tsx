import Link from "next/link";
import { questions } from "@/data/questions";
import { cases } from "@/data/cases";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-14">
      <header className="text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand-dark rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          <span>תרגול חובשים</span>
          <span className="opacity-60">·</span>
          <span>קורס רפואת חירום ונהגי אמבולנס</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3 text-slate-900">
          התכוננות מעשית למבחן ולשטח
        </h1>
        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
          תרגול בחירה מרובה, אנמנזה קולית עם משוב חכם, ומבחני סימולציה מעורבים - הכל בעברית מלאה.
        </p>
        <div className="mt-3 text-sm text-slate-500">
          {questions.length} שאלות אמריקאיות · {cases.length} מקרים לאנמנזה
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4 md:gap-6">
        <Link
          href="/practice/quiz"
          className="card hover:shadow-md hover:border-brand/40 transition group"
        >
          <div className="text-3xl mb-3">📝</div>
          <h2 className="text-xl font-bold mb-2 group-hover:text-brand-dark">שאלות אמריקאיות</h2>
          <p className="text-slate-600 text-sm">
            תרגול שאלות בחירה מרובה לפי נושאים, עם אפשרות לחשוף את התשובה הנכונה והסבר.
          </p>
        </Link>

        <Link
          href="/practice/anamnesis"
          className="card hover:shadow-md hover:border-brand/40 transition group"
        >
          <div className="text-3xl mb-3">🎙️</div>
          <h2 className="text-xl font-bold mb-2 group-hover:text-brand-dark">אנמנזה קולית</h2>
          <p className="text-slate-600 text-sm">
            האפליקציה מקריאה מקרה, אתם עונים בקול, ומקבלים משוב מפורט על מה שכוסה ומה חסר.
          </p>
        </Link>

        <Link
          href="/exam"
          className="card hover:shadow-md hover:border-brand/40 transition group"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-xl font-bold mb-2 group-hover:text-brand-dark">מבחן מעורב</h2>
          <p className="text-slate-600 text-sm">
            40 שאלות אמיתיות - שילוב של בחירה מרובה ומקרים. ציון אחיד, סיכום וטעויות לחזרה.
          </p>
        </Link>
      </section>

      <section className="mt-10 grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-3">איך זה עובד?</h3>
          <ol className="text-sm text-slate-700 space-y-2 list-decimal pr-4">
            <li>בוחרים מצב תרגול - שאלות, אנמנזה או מבחן מעורב.</li>
            <li>במצב אנמנזה, האפליקציה מקריאה את המקרה בעברית.</li>
            <li>לוחצים על המיקרופון ועונים בקול את האנמנזה.</li>
            <li>מקבלים משוב: מה כוסה נכון, מה חסר, והצעות לשיפור.</li>
            <li>במבחן מעורב מקבלים ציון סיכום ויכולים לחזור על טעויות.</li>
          </ol>
        </div>
        <div className="card">
          <h3 className="font-bold text-lg mb-3">נושאים בקורס</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {["מערכת העצבים", "מערכת הנשימה", "לב וכלי דם", "החייאה", "טראומה", "כוויות", "הכשות", "אנפילקסיס", "אסטמה", "סוכרת", "אי ספיקת לב", "אירוע מוחי", "הריון ולידה", "ילדים ותינוקות", "אר\"ן", "טרמינולוגיה"].map(t => (
              <span key={t} className="badge bg-brand/10 text-brand-dark">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        בהצלחה! זכרו - אין תחליף לאימון בשטח.
      </footer>
    </main>
  );
}
