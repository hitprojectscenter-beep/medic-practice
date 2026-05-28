"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AnswerEvent,
  GameStats,
  StatChange,
  loadStats,
  recordAnswer,
  recordExamComplete,
  resetStats
} from "@/lib/gamification";

export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [lastChange, setLastChange] = useState<StatChange | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const onAnswer = useCallback(
    (event: AnswerEvent) => {
      setStats(prev => {
        const base = prev || loadStats();
        const { stats: next, change } = recordAnswer(event, base);
        setLastChange(change);
        return next;
      });
    },
    []
  );

  const onExamComplete = useCallback(() => {
    setStats(prev => {
      const base = prev || loadStats();
      return recordExamComplete(base);
    });
  }, []);

  const reset = useCallback(() => {
    setStats(resetStats());
    setLastChange(null);
  }, []);

  const clearChange = useCallback(() => setLastChange(null), []);

  return { stats, lastChange, onAnswer, onExamComplete, reset, clearChange };
};
