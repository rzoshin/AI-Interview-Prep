"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * Minimal Web Speech API typings — the recognition constructor is not
 * part of the standard TS DOM lib, so we declare just what we use.
 * ------------------------------------------------------------------ */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/* ------------------------------------------------------------------ *
 * Speech-to-text: microphone -> transcript
 * ------------------------------------------------------------------ */
interface UseSpeechRecognitionOptions {
  // Called with each finalized chunk of recognized speech.
  onFinalResult?: (text: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onFinalResult,
  lang = "en-US",
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalResult);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    setIsSupported(true);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) onFinalRef.current?.(trimmed);
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // "no-speech" / "aborted" are routine; don't treat them as fatal.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[speech] recognition error:", event.error);
      }
    };

    // Browsers auto-stop after silence; restart while the user wants to keep talking.
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to stopped state
        }
      }
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || shouldListenRef.current) return;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      shouldListenRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    shouldListenRef.current = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggle = useCallback(() => {
    if (shouldListenRef.current) stop();
    else start();
  }, [start, stop]);

  return { isSupported, isListening, interimTranscript, start, stop, toggle };
}

/* ------------------------------------------------------------------ *
 * Text-to-speech: AI voice
 *
 * Prefers OpenAI's neural voices (far more human) when the server has them
 * configured, and transparently falls back to the browser's built-in
 * SpeechSynthesis voices otherwise.
 * ------------------------------------------------------------------ */
interface SpeakOptions {
  onEnd?: () => void;
}

export interface VoiceOption {
  id: string;
  label: string;
}

export type TtsProvider = "cloud" | "browser" | null;

// Curated OpenAI neural voices shown when cloud TTS is available.
const OPENAI_VOICE_OPTIONS: VoiceOption[] = [
  { id: "nova", label: "Nova (warm, female)" },
  { id: "shimmer", label: "Shimmer (bright, female)" },
  { id: "coral", label: "Coral (friendly, female)" },
  { id: "alloy", label: "Alloy (neutral)" },
  { id: "sage", label: "Sage (calm)" },
  { id: "echo", label: "Echo (male)" },
  { id: "onyx", label: "Onyx (deep, male)" },
  { id: "ash", label: "Ash (male)" },
  { id: "ballad", label: "Ballad (male)" },
  { id: "fable", label: "Fable (storyteller)" },
  { id: "verse", label: "Verse (expressive)" },
];

// Names that signal a high-quality (neural/natural) browser voice.
const NATURAL_HINTS = /natural|neural|enhanced|premium|siri/i;
const GOOD_NAMES =
  /samantha|ava|allison|serena|zoe|nathan|aaron|evan|joelle|noelle|google|microsoft|jenny|aria|guy|libby|sonia/i;

function scoreBrowserVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  if (NATURAL_HINTS.test(v.name)) score += 6;
  if (GOOD_NAMES.test(v.name)) score += 4;
  if (!v.localService) score += 3;
  const lang = v.lang.toLowerCase();
  if (lang === "en-us") score += 2;
  else if (lang === "en-gb") score += 1;
  return score;
}

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [provider, setProvider] = useState<TtsProvider>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceURI, setVoiceURIState] = useState<string | null>(null);

  const providerRef = useRef<TtsProvider>(null);
  const voiceURIRef = useRef<string | null>(null);
  const userPickedRef = useRef(false);
  const browserVoicesRef = useRef<Map<string, SpeechSynthesisVoice>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Invalidates in-flight cloud requests when we cancel/replace speech.
  const playIdRef = useRef(0);
  // In-session cache of synthesized audio URLs (voice::text -> url) so replaying
  // the same line never triggers a second OpenAI charge.
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    voiceURIRef.current = voiceURI;
  }, [voiceURI]);
  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  // Initialize: probe cloud TTS, otherwise set up browser voices.
  useEffect(() => {
    let cancelled = false;
    const browserSupported = typeof window !== "undefined" && "speechSynthesis" in window;

    const setupBrowser = () => {
      if (!browserSupported) {
        setIsSupported(false);
        return;
      }
      setProvider("browser");
      providerRef.current = "browser";
      setIsSupported(true);

      const load = () => {
        const all = window.speechSynthesis.getVoices();
        const english = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
        const pool = english.length > 0 ? english : all;
        const ranked = [...pool].sort((a, b) => scoreBrowserVoice(b) - scoreBrowserVoice(a));

        const map = new Map<string, SpeechSynthesisVoice>();
        ranked.forEach((v) => map.set(v.voiceURI, v));
        browserVoicesRef.current = map;
        setVoices(ranked.map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})` })));

        if (!userPickedRef.current && ranked.length > 0) {
          setVoiceURIState(ranked[0].voiceURI);
          voiceURIRef.current = ranked[0].voiceURI;
        }
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    };

    async function init() {
      try {
        const res = await fetch("/api/ai/tts");
        const json = await res.json();
        if (!cancelled && res.ok && json?.success && json.data?.available) {
          setProvider("cloud");
          providerRef.current = "cloud";
          setIsSupported(true);
          setVoices(OPENAI_VOICE_OPTIONS);
          if (!userPickedRef.current) {
            setVoiceURIState(OPENAI_VOICE_OPTIONS[0].id);
            voiceURIRef.current = OPENAI_VOICE_OPTIONS[0].id;
          }
          return;
        }
      } catch {
        // ignore — fall back to browser
      }
      if (!cancelled) setupBrowser();
    }

    init();

    return () => {
      cancelled = true;
      if (browserSupported) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const setVoiceURI = useCallback((uri: string | null) => {
    userPickedRef.current = true;
    setVoiceURIState(uri);
    voiceURIRef.current = uri;
  }, []);

  const cancel = useCallback(() => {
    playIdRef.current += 1; // invalidate any pending cloud request
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const browserSpeak = useCallback((text: string, options: SpeakOptions) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options.onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = voiceURIRef.current
      ? browserVoicesRef.current.get(voiceURIRef.current)
      : undefined;
    if (chosen) {
      utterance.voice = chosen;
      utterance.lang = chosen.lang;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const playUrl = useCallback((url: string, playId: number, options: SpeakOptions) => {
    if (playId !== playIdRef.current) return; // superseded/cancelled
    const audio = new Audio(url);
    audioRef.current = audio;
    const finish = () => {
      if (audioRef.current === audio) audioRef.current = null;
      if (playId === playIdRef.current) setIsSpeaking(false);
      options.onEnd?.();
    };
    audio.onended = finish;
    audio.onerror = finish;
    void audio.play().catch(finish);
  }, []);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!text.trim()) {
        options.onEnd?.();
        return;
      }
      cancel();

      if (providerRef.current !== "cloud") {
        browserSpeak(text, options);
        return;
      }

      const playId = ++playIdRef.current;
      setIsSpeaking(true);

      const voice = voiceURIRef.current ?? "nova";
      const cacheKey = `${voice}::${text.replace(/\s+/g, " ").trim()}`;
      const cachedUrl = urlCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        playUrl(cachedUrl, playId, options);
        return;
      }

      fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok || !json?.success || !json.data?.url) {
            throw new Error(json?.error || "TTS request failed");
          }
          return json.data.url as string;
        })
        .then((url) => {
          urlCacheRef.current.set(cacheKey, url);
          playUrl(url, playId, options);
        })
        .catch(() => {
          if (playId !== playIdRef.current) return;
          // Cloud failed mid-session — fall back to browser voice for this line.
          browserSpeak(text, options);
        });
    },
    [cancel, browserSpeak, playUrl]
  );

  return {
    isSupported,
    isSpeaking,
    provider,
    speak,
    cancel,
    voices,
    voiceURI,
    setVoiceURI,
  };
}
