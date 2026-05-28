"use client";

// ============= Text To Speech (Web Speech API) =============
let cachedVoices: SpeechSynthesisVoice[] | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise(resolve => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const ready = synth.getVoices();
    if (ready.length) {
      cachedVoices = ready;
      resolve(ready);
      return;
    }
    let resolved = false;
    const onVoices = () => {
      if (resolved) return;
      const v = synth.getVoices();
      if (v.length) {
        resolved = true;
        cachedVoices = v;
        synth.onvoiceschanged = null;
        resolve(v);
      }
    };
    synth.onvoiceschanged = onVoices;
    // safety fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const v = synth.getVoices();
        cachedVoices = v;
        resolve(v);
      }
    }, 1500);
  });

export const pickHebrewVoice = async (): Promise<SpeechSynthesisVoice | null> => {
  const voices = cachedVoices ?? (await loadVoices());
  if (!voices.length) return null;
  // Prefer he-IL voices, then "Hebrew" voices, then default
  const heIL = voices.find(v => v.lang === "he-IL");
  if (heIL) return heIL;
  const hebrew = voices.find(v => /hebrew/i.test(v.name) || /he[-_]/i.test(v.lang));
  if (hebrew) return hebrew;
  return null;
};

export const speak = async (
  text: string,
  opts: { rate?: number; pitch?: number; volume?: number; onEnd?: () => void; onStart?: () => void } = {}
): Promise<void> => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop any current
  const utter = new SpeechSynthesisUtterance(text);
  const voice = await pickHebrewVoice();
  if (voice) utter.voice = voice;
  utter.lang = "he-IL";
  utter.rate = opts.rate ?? 0.95;
  utter.pitch = opts.pitch ?? 1;
  utter.volume = opts.volume ?? 1;
  if (opts.onStart) utter.onstart = () => opts.onStart!();
  if (opts.onEnd) utter.onend = () => opts.onEnd!();
  synth.speak(utter);
};

export const stopSpeaking = (): void => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
};

// ============= Speech To Text =============
// Browser-based via Web Speech Recognition (Hebrew)
// Falls back to MediaRecorder + Whisper API endpoint when browser API not available
export type STTResult = { text: string; source: "browser" | "whisper" };

type SpeechRecognitionClass = new () => any;

const getSpeechRecognition = (): SpeechRecognitionClass | null => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const isBrowserSTTAvailable = (): boolean => !!getSpeechRecognition();

export type LiveSTT = {
  start: () => void;
  stop: () => Promise<STTResult>;
  onPartial?: (text: string) => void;
};

export const createBrowserSTT = (lang = "he-IL"): LiveSTT | null => {
  const SR = getSpeechRecognition();
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = "";
  let interimText = "";
  let onPartial: ((t: string) => void) | undefined;

  rec.onresult = (event: any) => {
    interimText = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript + " ";
      else interimText += transcript;
    }
    if (onPartial) onPartial((finalText + " " + interimText).trim());
  };

  const obj: LiveSTT = {
    start: () => {
      finalText = "";
      interimText = "";
      try { rec.start(); } catch { /* already started */ }
    },
    stop: () =>
      new Promise(resolve => {
        rec.onend = () => resolve({ text: (finalText + " " + interimText).trim(), source: "browser" });
        rec.onerror = () => resolve({ text: (finalText + " " + interimText).trim(), source: "browser" });
        try { rec.stop(); } catch { resolve({ text: (finalText + " " + interimText).trim(), source: "browser" }); }
      }),
    get onPartial() { return onPartial; },
    set onPartial(fn) { onPartial = fn; }
  };
  return obj;
};

// ============= Whisper fallback via MediaRecorder =============
export type WhisperRecorder = {
  start: () => Promise<void>;
  stop: () => Promise<STTResult>;
};

export const createWhisperRecorder = (): WhisperRecorder => {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    start: async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start();
    },
    stop: () =>
      new Promise(async (resolve, reject) => {
        if (!recorder) return reject(new Error("recorder not started"));
        recorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: recorder!.mimeType || "audio/webm" });
            stream?.getTracks().forEach(t => t.stop());
            const form = new FormData();
            form.append("audio", blob, "recording.webm");
            const res = await fetch("/api/transcribe", { method: "POST", body: form });
            if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
            const data = await res.json();
            resolve({ text: data.text || "", source: "whisper" });
          } catch (err) {
            reject(err);
          }
        };
        recorder.stop();
      })
  };
};
