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
  /** Optional partial buffer to use as fallback if no result comes back */
  partialBufferRef?: { current: string };
};

/** Race a promise against a timeout; rejects if the timeout hits first */
const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} - תפוגת זמן`)), ms);
    promise.then(
      val => { clearTimeout(timer); resolve(val); },
      err => { clearTimeout(timer); reject(err); }
    );
  });

export default function Mic({ preferWhisper, onFinish, onPartial, disabled, partialBufferRef }: Props) {
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
        if (!stt) throw new Error("דפדפן ללא תמיכה בזיהוי קולי");
        sttRef.current = stt;
        stt.onPartial = (t: string) => {
          if (partialBufferRef) partialBufferRef.current = t;
          onPartial?.(t);
        };
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
    let finishCalled = false;

    // Hard safety fallback: never leave the user stuck. After 20 s force-finish.
    const hardTimeoutId = setTimeout(() => {
      if (finishCalled) return;
      finishCalled = true;
      setProcessing(false);
      const partial = partialBufferRef?.current?.trim() || "";
      setError("ההקלטה נתקעה - מסיים עם הטקסט שכבר זוהה");
      onFinish(partial, usingWhisper ? "whisper" : "browser");
    }, 20000);

    try {
      let result: { text: string; source: "browser" | "whisper" } | undefined;
      if (usingWhisper && whisperRef.current) {
        // Whisper round-trip: 15 s ceiling.
        result = await withTimeout(whisperRef.current.stop(), 15000, "תמלול Whisper");
        whisperRef.current = null;
      } else if (sttRef.current) {
        // Browser STT stop is fast (the `onend` event), but iOS sometimes
        // never fires it - 4 s ceiling.
        result = await withTimeout(sttRef.current.stop(), 4000, "זיהוי דפדפן");
        sttRef.current = null;
      }
      if (!finishCalled) {
        finishCalled = true;
        clearTimeout(hardTimeoutId);
        const text = result?.text?.trim() || partialBufferRef?.current?.trim() || "";
        onFinish(text, result?.source || (usingWhisper ? "whisper" : "browser"));
      }
    } catch (e: any) {
      // Stop failed (timeout, network, mic permission) - still recover gracefully.
      if (!finishCalled) {
        finishCalled = true;
        clearTimeout(hardTimeoutId);
        const partial = partialBufferRef?.current?.trim() || "";
        setError(partial
          ? `שגיאה: ${e?.message || ""} - שולח את הטקסט שזוהה עד כה`
          : (e?.message || "שגיאה בעצירת ההקלטה"));
        onFinish(partial, usingWhisper ? "whisper" : "browser");
      }
      // Forcibly release the mic if possible
      try { sttRef.current = null; whisperRef.current = null; } catch {}
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
      {/* Emergency reset if processing hangs */}
      {processing && (
        <button
          onClick={() => {
            setProcessing(false);
            const partial = partialBufferRef?.current?.trim() || "";
            onFinish(partial, usingWhisper ? "whisper" : "browser");
          }}
          className="text-xs text-red-600 underline"
        >
          ביטול עיבוד ושליחה
        </button>
      )}
      {error && <div className="text-xs text-red-600 max-w-xs text-center">{error}</div>}
    </div>
  );
}
