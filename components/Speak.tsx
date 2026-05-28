"use client";
import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking } from "@/lib/speech";

type Props = {
  text: string;
  /** האם להשמיע אוטומטית כשהקומפוננטה נטענת */
  autoplay?: boolean;
  label?: string;
};

export default function Speak({ text, autoplay, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const startedAutoplayRef = useRef(false);

  useEffect(() => {
    if (autoplay && !startedAutoplayRef.current) {
      startedAutoplayRef.current = true;
      // השמעה אוטומטית עלולה להיחסם בלי אינטראקציה - מטופל גם בכפתור
      handlePlay();
    }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = () => {
    setPlaying(true);
    speak(text, {
      onEnd: () => setPlaying(false)
    });
  };

  const handleStop = () => {
    stopSpeaking();
    setPlaying(false);
  };

  return (
    <button
      onClick={playing ? handleStop : handlePlay}
      className="btn-secondary inline-flex items-center gap-2"
      aria-label={playing ? "עצור הקראה" : "השמע מקרה"}
    >
      <span className="text-xl">{playing ? "⏸" : "▶"}</span>
      <span>{playing ? "עצור" : label || "השמע מקרה"}</span>
    </button>
  );
}
