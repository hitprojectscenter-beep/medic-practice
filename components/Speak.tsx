"use client";
import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking, hasHebrewVoice } from "@/lib/speech";

type Props = {
  text: string;
  /** Auto-play when component mounts (blocked without user interaction) */
  autoplay?: boolean;
  label?: string;
};

/** Detect platform for voice-install instructions */
function usePlatform() {
  const [platform, setPlatform] = useState<"ios" | "android" | "windows" | "mac" | "other">("other");
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    else if (/Win/.test(navigator.platform)) setPlatform("windows");
    else if (/Mac/.test(navigator.platform)) setPlatform("mac");
  }, []);
  return platform;
}

const VOICE_GUIDE: Record<string, { icon: string; steps: string[] }> = {
  ios: {
    icon: "🍎",
    steps: [
      'פתחו הגדרות (Settings)',
      'נגישות (Accessibility)',
      'תוכן מדובר (Spoken Content)',
      'קולות (Voices)',
      'עברית (Hebrew)',
      'הורידו קול כלשהו ← הכניסו ל-Wi-Fi',
    ],
  },
  android: {
    icon: "🤖",
    steps: [
      'הגדרות ← נגישות ← הפקת טקסט לדיבור (TTS)',
      'לחצו על ⚙️ ליד "מנוע Google TTS"',
      'שפות ← הוסף שפה ← עברית',
      'המתינו להורדה ← הפעילו מחדש',
    ],
  },
  windows: {
    icon: "🪟",
    steps: [
      'הגדרות → זמן ושפה → דיבור',
      'נהל קולות → הוסף קולות',
      'חפשו "Hebrew" ← לחצו הוסף',
    ],
  },
  mac: {
    icon: "🍏",
    steps: [
      'System Settings → Accessibility → Spoken Content',
      'System Voice → Manage Voices',
      'Hebrew ← הורידו קול',
    ],
  },
  other: {
    icon: "💻",
    steps: ['התקינו קול עברי בהגדרות הנגישות של מערכת ההפעלה שלכם'],
  },
};

export default function Speak({ text, autoplay, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const [hebrewOk, setHebrewOk] = useState<boolean | null>(null); // null = loading
  const [showGuide, setShowGuide] = useState(false);
  const startedAutoplayRef = useRef(false);
  const platform = usePlatform();
  const guide = VOICE_GUIDE[platform] ?? VOICE_GUIDE.other;

  useEffect(() => {
    hasHebrewVoice().then(setHebrewOk);

    if (autoplay && !startedAutoplayRef.current) {
      startedAutoplayRef.current = true;
      handlePlay();
    }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = () => {
    setPlaying(true);
    speak(text, { onEnd: () => setPlaying(false) });
  };

  const handleStop = () => {
    stopSpeaking();
    setPlaying(false);
  };

  return (
    <div className="space-y-2">
      {/* Main play/stop button */}
      <button
        onClick={playing ? handleStop : handlePlay}
        className={`btn-secondary inline-flex items-center gap-2 ${
          hebrewOk === false ? "opacity-70" : ""
        }`}
        aria-label={playing ? "עצור הקראה" : "השמע מקרה"}
      >
        <span className="text-xl">{playing ? "⏸" : "▶"}</span>
        <span>{playing ? "עצור" : label || "השמע מקרה"}</span>
        {hebrewOk === null && (
          <span className="text-xs text-slate-400 animate-pulse">...</span>
        )}
        {hebrewOk === true && (
          <span className="text-xs text-emerald-600" title="קול עברי פעיל">🔊</span>
        )}
        {hebrewOk === false && (
          <span className="text-xs text-amber-500" title="קול עברי לא זמין">⚠️</span>
        )}
      </button>

      {/* Warning + guided steps when no Hebrew voice */}
      {hebrewOk === false && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm max-w-sm">
          <button
            className="flex w-full items-center justify-between gap-2 font-bold text-amber-800 text-right"
            onClick={() => setShowGuide(g => !g)}
          >
            <span>⚠️ קול עברי לא מותקן – ההקראה תהיה לקויה</span>
            <span className="text-amber-600 text-base leading-none">{showGuide ? "▲" : "▼"}</span>
          </button>

          {showGuide && (
            <div className="mt-2 space-y-1 border-t border-amber-200 pt-2">
              <p className="font-extrabold text-amber-900 mb-1">
                {guide.icon} הוראות התקנה:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-800 text-xs">
                {guide.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <p className="text-xs text-amber-700 mt-1">
                לאחר ההתקנה, רענן את הדף.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
