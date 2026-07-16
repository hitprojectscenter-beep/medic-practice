"use client";
import { useEffect, useState } from "react";
import { StatChange } from "@/lib/gamification";

type Props = {
  change: StatChange | null;
  isCorrect?: boolean;
  emoji?: string;
  text?: string;
  onDone?: () => void;
  /** Duration in ms before auto-dismiss. Default 2000. */
  durationMs?: number;
};

const CONFETTI_EMOJIS = ["🎉", "✨", "⭐", "🎊", "💫"];

export default function Celebration({ change, isCorrect, emoji, text, onDone, durationMs = 2000 }: Props) {
  const [show, setShow] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; emoji: string; delay: number }[]>([]);

  useEffect(() => {
    if (!change && !emoji) return;
    setShow(true);

    const shouldConfetti = isCorrect && change && (change.leveledUp || change.unlockedAchievements.length > 0 || change.newStreak >= 5);
    if (shouldConfetti) {
      const arr = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
        delay: Math.random() * 0.5
      }));
      setConfetti(arr);
    } else {
      setConfetti([]);
    }
    const t = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [change, emoji, isCorrect, onDone, durationMs]);

  if (!show) return null;

  const displayEmoji = emoji || (isCorrect ? "🎉" : "💔");
  const displayText = text || (isCorrect ? "כל הכבוד!" : "ננסה שוב");

  const dismiss = () => {
    setShow(false);
    onDone?.();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={dismiss}>
      {/* Confetti layer - pointer-events-none so clicks pass through */}
      <div className="pointer-events-none absolute inset-0">
        {confetti.map(c => (
          <span
            key={c.id}
            className="absolute text-2xl confetti-piece"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>
      <div className="pop-in flex flex-col items-center gap-2 relative">
        {/* X close button */}
        <button
          onClick={e => { e.stopPropagation(); dismiss(); }}
          className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white/90 shadow-lg text-slate-700 hover:bg-white hover:text-red-600 transition flex items-center justify-center font-bold"
          aria-label="סגור"
        >
          ✕
        </button>
        <div className={`text-7xl md:text-8xl drop-shadow-2xl ${isCorrect === false ? "opacity-80" : ""}`}>
          {displayEmoji}
        </div>
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg text-lg font-extrabold text-slate-800">
          {displayText}
        </div>
        <div className="text-xs text-white/80 mt-1 drop-shadow">לחיצה בכל מקום סוגרת</div>
      </div>
    </div>
  );
}
