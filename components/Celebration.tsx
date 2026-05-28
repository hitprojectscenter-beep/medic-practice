"use client";
import { useEffect, useState } from "react";
import { StatChange } from "@/lib/gamification";

type Props = {
  change: StatChange | null;
  isCorrect?: boolean;
  emoji?: string;
  text?: string;
  onDone?: () => void;
};

const CONFETTI_EMOJIS = ["🎉", "✨", "⭐", "🎊", "💫"];

export default function Celebration({ change, isCorrect, emoji, text, onDone }: Props) {
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
    }, 1400);
    return () => clearTimeout(t);
  }, [change, emoji, isCorrect, onDone]);

  if (!show) return null;

  const displayEmoji = emoji || (isCorrect ? "🎉" : "💔");
  const displayText = text || (isCorrect ? "כל הכבוד!" : "ננסה שוב");

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
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
      <div className="pop-in flex flex-col items-center gap-2">
        <div className={`text-7xl md:text-8xl drop-shadow-2xl ${isCorrect === false ? "opacity-80" : ""}`}>
          {displayEmoji}
        </div>
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg text-lg font-extrabold text-slate-800">
          {displayText}
        </div>
      </div>
    </div>
  );
}
