"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GameStats, getRank, xpToNextLevel, loadStats } from "@/lib/gamification";

type Props = {
  stats?: GameStats | null;
  compact?: boolean;
};

export default function StatsBar({ stats: propStats, compact }: Props) {
  const [stats, setStats] = useState<GameStats | null>(propStats ?? null);

  useEffect(() => {
    if (!propStats) setStats(loadStats());
  }, [propStats]);

  useEffect(() => {
    if (propStats) setStats(propStats);
  }, [propStats]);

  if (!stats) {
    return (
      <div className={`flex items-center gap-3 ${compact ? "text-sm" : "text-base"} animate-pulse`}>
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="h-3 w-32 bg-slate-200 rounded" />
      </div>
    );
  }

  const rank = getRank(stats.level);
  const prog = xpToNextLevel(stats.xp);

  return (
    <div className={`flex items-center gap-3 ${compact ? "text-sm" : ""}`}>
      <div
        className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl shadow-lg text-2xl"
        style={{
          background: `linear-gradient(135deg, ${rank.color} 0%, ${rank.color}aa 100%)`,
          boxShadow: `0 4px 14px ${rank.color}40`
        }}
        title={`${rank.title} - רמה ${rank.level}`}
      >
        <span className="drop-shadow-lg">{rank.emoji}</span>
        <span className="absolute -bottom-1 -left-1 bg-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-100" style={{ color: rank.color }}>
          {stats.level}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold truncate" style={{ color: rank.color }}>{rank.title}</span>
          <span className="text-xs text-slate-500 font-mono">{stats.xp} XP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 md:w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${prog.pct}%`,
                background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`
              }}
            />
          </div>
          {prog.needed > 0 ? (
            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
              {prog.current}/{prog.needed}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600">MAX 👑</span>
          )}
        </div>
      </div>
      {stats.currentStreak > 0 && (
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-sm ${
            stats.currentStreak >= 5 ? "bg-orange-100 text-orange-700" : "bg-amber-50 text-amber-700"
          }`}
          title={`רצף נוכחי: ${stats.currentStreak}`}
        >
          <span className={stats.currentStreak >= 5 ? "animate-pulse" : ""}>🔥</span>
          <span>{stats.currentStreak}</span>
        </div>
      )}
    </div>
  );
}
