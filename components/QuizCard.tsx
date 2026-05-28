"use client";
import { useState } from "react";
import { QuizQuestion } from "@/data/questions";

type Props = {
  q: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  showRevealButton?: boolean;
};

export default function QuizCard({ q, index, total, onAnswer, onNext, showRevealButton = true }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const submit = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(i, i === q.correctIndex);
  };

  const reveal = () => setRevealed(true);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
        <span className="badge bg-slate-100 text-slate-600">{q.topic}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <h2 className="text-lg md:text-xl font-bold mb-5 leading-relaxed">{q.question}</h2>
      <div className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.correctIndex;
          const showCorrect = (selected !== null || revealed) && isCorrect;
          const showWrong = selected !== null && isSelected && !isCorrect;
          const base =
            "text-right rounded-xl px-4 py-3 border-2 transition text-sm md:text-base font-medium leading-relaxed";
          const cls = showCorrect
            ? "bg-green-50 border-green-500 text-green-900"
            : showWrong
            ? "bg-red-50 border-red-500 text-red-900"
            : "bg-white border-slate-200 hover:border-brand/40 hover:bg-brand/5";
          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={selected !== null}
              className={`${base} ${cls} disabled:cursor-not-allowed flex items-start gap-3`}
            >
              <span className="inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-sm shrink-0">
                {String.fromCharCode(1488 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {showCorrect && <span className="text-green-700">✓</span>}
              {showWrong && <span className="text-red-700">✗</span>}
            </button>
          );
        })}
      </div>

      {(selected !== null || revealed) && q.explanation && (
        <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
          <div className="font-bold mb-1">הסבר</div>
          {q.explanation}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        {selected === null && !revealed && showRevealButton ? (
          <button onClick={reveal} className="btn-ghost text-sm">הצג תשובה נכונה</button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          className="btn-primary mr-auto"
          disabled={selected === null && !revealed}
        >
          המשך ←
        </button>
      </div>
    </div>
  );
}
