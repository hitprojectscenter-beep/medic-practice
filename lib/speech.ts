"use client";

// ============= Text Cleaning for TTS =============
/**
 * Remove Unicode directional/invisible marks that corrupt Hebrew TTS.
 * Common culprits from PDF-extracted text: RTL mark, LTR mark,
 * directional embeddings, zero-width spaces, BOM.
 */
export const cleanTextForTTS = (text: string): string =>
  text
    // Unicode directional controls (PDF artifacts)
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    // Zero-width characters
    .replace(/[​‌‍﻿]/g, "")
    // Normalize multiple whitespace to single space
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * Split long text into TTS-safe chunks.
 * iOS Safari stops unexpectedly for utterances > ~200 chars.
 * Split on sentence/clause boundaries to keep chunks natural.
 */
export const chunkTextForTTS = (text: string, maxLen = 170): string[] => {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  // Split on sentence-ending punctuation followed by space
  // Hebrew uses . ! ? and also ، ؛ :
  const parts = text.split(/(?<=[.!?:،؛\n])\s+/);
  let current = "";

  for (const part of parts) {
    if (!part.trim()) continue;
    if (current.length + part.length + 1 > maxLen && current) {
      chunks.push(current.trim());
      current = part;
    } else {
      current += (current ? " " : "") + part;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // If a single part is still too long, hard-split at word boundary
  return chunks.flatMap(chunk => {
    if (chunk.length <= maxLen) return [chunk];
    const words = chunk.split(" ");
    const sub: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur.length + w.length + 1 > maxLen && cur) {
        sub.push(cur);
        cur = w;
      } else {
        cur += (cur ? " " : "") + w;
      }
    }
    if (cur) sub.push(cur);
    return sub;
  });
};

// ============= Voice Loading =============
let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (voiceLoadPromise) return voiceLoadPromise;

  voiceLoadPromise = new Promise(resolve => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;

    // Synchronous check first (works on Chrome desktop)
    const immediate = synth.getVoices();
    if (immediate.length) {
      cachedVoices = immediate;
      resolve(immediate);
      return;
    }

    let resolved = false;
    const done = (voices: SpeechSynthesisVoice[]) => {
      if (resolved) return;
      resolved = true;
      cachedVoices = voices;
      voiceLoadPromise = null; // allow retry later
      resolve(voices);
    };

    // voiceschanged fires on Chrome/Android when voices are ready
    synth.onvoiceschanged = () => {
      const v = synth.getVoices();
      if (v.length) {
        synth.onvoiceschanged = null;
        done(v);
      }
    };

    // iOS Safari: poll because voiceschanged is unreliable
    let polls = 0;
    const poll = () => {
      if (resolved) return;
      const v = synth.getVoices();
      if (v.length) { done(v); return; }
      polls++;
      if (polls < 15) setTimeout(poll, 300); // poll for up to ~4.5 seconds
      else done([]); // give up
    };
    setTimeout(poll, 200);
  });

  return voiceLoadPromise;
};

// Kick off voice preloading immediately on module import (speeds things up)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
}

/** Pick the best available Hebrew voice, or null if none installed */
export const pickHebrewVoice = async (): Promise<SpeechSynthesisVoice | null> => {
  const voices = await loadVoices();
  if (!voices.length) return null;

  // Priority: exact he-IL → any "he" lang → "Hebrew" in name → Hebrew chars in name
  return (
    voices.find(v => v.lang === "he-IL") ??
    voices.find(v => v.lang.startsWith("he")) ??
    voices.find(v => /hebrew/i.test(v.name)) ??
    voices.find(v => /[א-ת]/.test(v.name)) ?? // actual Hebrew letters
    null
  );
};

/** Returns true when a Hebrew voice is available on this device */
export const hasHebrewVoice = async (): Promise<boolean> =>
  (await pickHebrewVoice()) !== null;

// ============= TTS Speak =============
let chunkStopFlag = false;

export const speak = async (
  rawText: string,
  opts: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onStart?: () => void;
  } = {}
): Promise<void> => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();
  chunkStopFlag = false;

  // Strip invisible/directional characters before speaking
  const text = cleanTextForTTS(rawText);
  if (!text) return;

  const voice = await pickHebrewVoice();
  // Break into iOS-safe chunks
  const chunks = chunkTextForTTS(text);

  let chunkIndex = 0;

  const speakNext = () => {
    if (chunkStopFlag) return;
    if (chunkIndex >= chunks.length) {
      opts.onEnd?.();
      return;
    }

    const chunk = chunks[chunkIndex++];
    const utter = new SpeechSynthesisUtterance(chunk);

    if (voice) utter.voice = voice;
    utter.lang = "he-IL";
    utter.rate = opts.rate ?? 0.9;   // slightly slower for clarity
    utter.pitch = opts.pitch ?? 1;
    utter.volume = opts.volume ?? 1;

    if (chunkIndex === 1) utter.onstart = () => opts.onStart?.();
    utter.onend = speakNext;
    utter.onerror = ev => {
      // "interrupted" can happen when switching chunks; retry once
      if ((ev as any).error === "interrupted" && !chunkStopFlag) {
        setTimeout(speakNext, 80);
      } else {
        speakNext(); // skip bad chunk, continue
      }
    };

    synth.speak(utter);
  };

  speakNext();
};

export const stopSpeaking = (): void => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  chunkStopFlag = true;
  window.speechSynthesis.cancel();
};

// ============= Speech To Text =============
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
  // Cache the *latest* text. We REBUILD from event.results each event to
  // avoid duplicate accumulation (some browsers re-fire isFinal=true for
  // the same result, which used to make text repeat).
  let lastText = "";
  let onPartial: ((t: string) => void) | undefined;

  rec.onresult = (event: any) => {
    // Collect all final transcripts + interim
    const allFinals: string[] = [];
    let interim = "";
    for (let i = 0; i < event.results.length; ++i) {
      const transcript = (event.results[i][0]?.transcript ?? "").trim();
      if (!transcript) continue;
      if (event.results[i].isFinal) allFinals.push(transcript);
      else interim += transcript + " ";
    }

    // Android Chrome with Hebrew often re-emits the SAME final transcript
    // across multiple result indices, sometimes as growing prefixes:
    //   results[0] = "שלום רב אדוני"           (final)
    //   results[1] = "שלום רב אדוני איך כבודו"  (final, super-set of [0])
    //   results[2] = "שלום רב אדוני איך כבודו"  (final, exact duplicate of [1])
    // Strip prefixes & duplicates BEFORE joining.
    const uniqueFinals: string[] = [];
    for (let i = 0; i < allFinals.length; i++) {
      const t = allFinals[i];
      // Is `t` a strict prefix of any other final? Skip (the longer wins)
      let superseded = false;
      for (let j = 0; j < allFinals.length; j++) {
        if (i === j) continue;
        if (allFinals[j].length > t.length && allFinals[j].startsWith(t)) {
          superseded = true;
          break;
        }
      }
      if (superseded) continue;
      if (uniqueFinals.includes(t)) continue;
      uniqueFinals.push(t);
    }

    const final = uniqueFinals.join(" ");
    lastText = (final + " " + interim).replace(/\s{2,}/g, " ").trim();
    // Final safety net: collapse repeated word-windows up to 15 words long.
    lastText = dedupeAdjacentPhrases(lastText);
    if (onPartial) onPartial(lastText);
  };

  const obj: LiveSTT = {
    start: () => {
      lastText = "";
      try { rec.start(); } catch { /* already started */ }
    },
    stop: () =>
      new Promise(resolve => {
        rec.onend = () => resolve({ text: lastText, source: "browser" });
        rec.onerror = () => resolve({ text: lastText, source: "browser" });
        try { rec.stop(); } catch { resolve({ text: lastText, source: "browser" }); }
      }),
    get onPartial() { return onPartial; },
    set onPartial(fn) { onPartial = fn; }
  };
  return obj;
};

/**
 * Collapse repeated adjacent phrases.
 * Examples:
 *   "שלום שלום שלום מה שלומך" → "שלום מה שלומך"
 *   "מה כואב לך מה כואב לך"     → "מה כואב לך"
 *   "שלום רב אדוני איך כבודו מרגיש למה שלום רב אדוני איך כבודו מרגיש למה" → first 7 words
 * Strategy: scan word windows of 1..15 words; if same window repeats, drop it.
 * Larger max window catches the long phrases Android Chrome emits.
 */
const dedupeAdjacentPhrases = (text: string): string => {
  if (!text) return text;
  let words = text.split(/\s+/);
  if (words.length < 2) return text;
  const MAX_WIN = 15;
  let i = 0;
  // Hard cap on iterations to defend against pathological loops
  let safety = words.length * 4;
  while (i < words.length && safety-- > 0) {
    let collapsed = false;
    const winCeiling = Math.min(MAX_WIN, Math.floor((words.length - i) / 2));
    // Largest window first so longer repeats collapse before shorter ones
    for (let win = winCeiling; win >= 1; win--) {
      const a = words.slice(i, i + win);
      const b = words.slice(i + win, i + 2 * win);
      if (a.length === b.length && a.every((w, k) => w === b[k])) {
        // Drop the duplicate copy; stay at same i to catch triples ("xxx" → "x")
        words.splice(i + win, win);
        collapsed = true;
        break;
      }
    }
    if (!collapsed) i++;
  }
  return words.join(" ");
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
