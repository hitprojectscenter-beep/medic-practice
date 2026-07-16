"use client";
import { useEffect, useState } from "react";
import { Achievement } from "@/lib/gamification";

type Props = {
  achievements: Achievement[];
  onDone?: () => void;
  /** Auto-dismiss duration ms. Default 2000. */
  durationMs?: number;
};

export default function AchievementToast({ achievements, onDone, durationMs = 2000 }: Props) {
  const [visible, setVisible] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!achievements.length) return;
    setVisible(achievements);
    const t = setTimeout(() => {
      setVisible([]);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [achievements, onDone, durationMs]);

  if (!visible.length) return null;

  const dismiss = () => {
    setVisible([]);
    onDone?.();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {visible.map((a, i) => (
        <div
          key={a.id}
          className="bg-gradient-to-l from-amber-400 to-yellow-300 text-amber-900 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 toast-in relative pr-10"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <button
            onClick={dismiss}
            className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-amber-100/80 hover:bg-amber-200 transition flex items-center justify-center text-sm font-bold"
            aria-label="סגור"
          >
            ✕
          </button>
          <div className="text-4xl">{a.emoji}</div>
          <div>
            <div className="text-xs font-bold opacity-80">🏆 הישג חדש!</div>
            <div className="font-extrabold text-base">{a.title}</div>
            <div className="text-xs opacity-90">{a.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
