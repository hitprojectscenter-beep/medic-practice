"use client";
import { useEffect, useRef, useState } from "react";
import {
  createBrowserSTT,
  createWhisperRecorder,
  isBrowserSTTAvailable,
  LiveSTT,
  WhisperRecorder
} from "@/lib/speech";

type Props = {
  /** האם להעדיף Whisper (איכותי יותר) על פני זיהוי דפדפן */
  preferWhisper?: boolean;
  /** קולבק עם הטקסט שזוהה כאשר המשתמש לחץ "סיים" */
  onFinish: (text: string, source: "browser" | "whisper") => void;
  /** קולבק עם טקסט חי תוך כדי דיבור (זיהוי דפדפן בלבד) */
  onPartial?: (text: string) => void;
  disabled?: boolean;
};

export default function Mic({ preferWhisper, onFinish, onPartial, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingWhisper, setUsingWhisper] = useState(false);
  const [processing, setProcessing] = useState(false);
  const sttRef = useRef<LiveSTT | null>(null);
  const whisperRef = useRef<WhisperRecorder | null>(null);

  useEffect(() => () => {
    try { sttRef.current?.stop(); } catch {}
  }, []);

  const start = async () => {
    setError(null);
    try {
      const browserAvailable = isBrowserSTTAvailable();
      const useWhisper = preferWhisper || !browserAvailable;
      setUsingWhisper(useWhisper);

      if (useWhisper) {
        const rec = createWhisperRecorder();
        whisperRef.current = rec;
        await rec.start();
      } else {
        const stt = createBrowserSTT("he-IL");
        if (!stt) throw new Error("דפדפן ללא תמיכה בזיהוי קולי - מנסה Whisper");
        sttRef.current = stt;
        stt.onPartial = (t: string) => onPartial?.(t);
        stt.start();
      }
      setRecording(true);
    } catch (e: any) {
      setError(e?.message || "שגיאה בהפעלת המיקרופון");
    }
  };

  const stop = async () => {
    setRecording(false);
    setProcessing(true);
    try {
      let result;
      if (usingWhisper && whisperRef.current) {
        result = await whisperRef.current.stop();
        whisperRef.current = null;
      } else if (sttRef.current) {
        result = await sttRef.current.stop();
        sttRef.current = null;
      }
      if (result) onFinish(result.text, result.source);
    } catch (e: any) {
      setError(e?.message || "שגיאה בעצירת ההקלטה");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={recording ? stop : start}
        disabled={disabled || processing}
        className={`relative rounded-full w-20 h-20 flex items-center justify-center text-3xl transition shadow-md ${
          recording
            ? "bg-red-500 text-white pulse-mic"
            : "bg-brand text-white hover:bg-brand-dark"
        } ${disabled || processing ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={recording ? "עצור הקלטה" : "התחל הקלטה"}
      >
        {processing ? "⏳" : recording ? "■" : "🎤"}
      </button>
      <div className="text-xs text-slate-600 text-center max-w-xs">
        {processing
          ? "מתמלל..."
          : recording
          ? `מקליט (${usingWhisper ? "Whisper" : "דפדפן"})... לחצו לסיום`
          : "לחצו על המיקרופון לדבר"}
      </div>
      {error && <div className="text-xs text-red-600 max-w-xs text-center">{error}</div>}
    </div>
  );
}
