"use client";
import { useEffect, useState } from "react";
import { QuizQuestion } from "@/data/questions";
import { correctEmoji, wrongEmoji } from "@/lib/gamification";

type Props = {
  q: QuizQuestion;
  index: number;
  total: number;
  currentStreak?: number;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  onSkip?: () => void;       // optional: when provided, shows a "skip" button before answering
  canSkip?: boolean;         // false when no replacement question is available
  skippedCount?: number;     // number of questions already skipped (for display)
  showRevealButton?: boolean;
};

export default function QuizCard({
  q, index, total, currentStreak = 0,
  onAnswer, onNext, onSkip, canSkip = true, skippedCount = 0,
  showRevealButton = true
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  // CRITICAL: reset all state when the question changes,
  // otherwise the previous answer's selection persists into the next question.
  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setFeedbackEmoji(null);
    setFlash(null);
  }, [q.id]);

  const submit = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    if (correct) {
      setFeedbackEmoji(correctEmoji(currentStreak + 1));
      setFlash("correct");
    } else {
      setFeedbackEmoji(wrongEmoji());
      setFlash("wrong");
    }
    onAnswer(i, correct);
    setTimeout(() => setFlash(null), 800);
  };

  const reveal = () => setRevealed(true);

  return (
    <div className={`card slide-in relative ${flash === "correct" ? "flash-correct" : flash === "wrong" ? "flash-wrong shake" : ""}`}>
      <div className="flex items-center justify-between mb-4 text-xs">
        <span className="badge bg-gradient-to-l from-teal-100 to-cyan-100 text-teal-800 border border-teal-200">
          {q.topic}
        </span>
        <div className="flex items-center gap-2">
          {currentStreak >= 3 && (
            <span className="badge bg-orange-100 text-orange-700 animate-pulse">
              🔥 {currentStreak}
            </span>
          )}
          <span className="text-slate-500 font-bold">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-l from-teal-400 to-cyan-500 transition-all duration-500 ease-out"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h2 className="text-lg md:text-xl font-extrabold mb-6 leading-relaxed text-slate-900">
        {q.question}
      </h2>

      <div className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.correctIndex;
          const showCorrect = (selected !== null || revealed) && isCorrect;
          const showWrong = selected !== null && isSelected && !isCorrect;
          const dim = selected !== null && !isSelected && !isCorrect;

          let cls = "bg-white border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 hover:scale-[1.01]";
          if (showCorrect) cls = "bg-gradient-to-l from-emerald-50 to-green-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-100";
          else if (showWrong) cls = "bg-gradient-to-l from-red-50 to-rose-50 border-red-500 text-red-900";
          else if (dim) cls = "bg-slate-50 border-slate-200 text-slate-500";

          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={selected !== null}
              className={`text-right rounded-2xl px-4 py-3.5 border-2 transition-all text-sm md:text-base font-medium leading-relaxed disabled:cursor-not-allowed flex items-start gap-3 ${cls}`}
            >
              <span className={`inline-flex items-center justify-center min-w-8 h-8 rounded-xl font-extrabold text-sm shrink-0 transition ${
                showCorrect ? "bg-emerald-500 text-white" :
                showWrong ? "bg-red-500 text-white" :
                "bg-slate-100 text-slate-600"
              }`}>
                {String.fromCharCode(1488 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {showCorrect && <span className="text-2xl">✓</span>}
              {showWrong && <span className="text-2xl">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Inline emoji feedback */}
      {feedbackEmoji && (
        <div className="mt-4 text-center pop-in">
          <div className="text-5xl mb-1">{feedbackEmoji}</div>
        </div>
      )}

      {(selected !== null || revealed) && q.explanation && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 text-sm fade-up">
          <div className="font-extrabold mb-1.5 flex items-center gap-2">
            <span>💡</span>
            <span>הסבר</span>
          </div>
          <div className="leading-relaxed">{q.explanation}</div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {selected === null && !revealed && onSkip && (
            <button
              onClick={onSkip}
              disabled={!canSkip}
              className="btn-ghost text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title={canSkip ? "החלפה בשאלה אחרת מהמאגר" : "אין עוד שאלות זמינות בנושא הזה"}
            >
              <span>⏭️</span>
              <span>דלג</span>
              {skippedCount > 0 && (
                <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 font-bold">
                  {skippedCount}
                </span>
              )}
            </button>
          )}
          {selected === null && !revealed && showRevealButton && (
            <button onClick={reveal} className="btn-ghost text-sm flex items-center gap-1.5">
              <span>👁️</span>
              <span>הצג תשובה</span>
            </button>
          )}
        </div>
        <button
          onClick={onNext}
          className="btn-primary mr-auto"
          disabled={selected === null && !revealed}
        >
          <span className="flex items-center gap-2">
            <span>המשך</span>
            <span>←</span>
          </span>
        </button>
      </div>
    </div>
  );
}
