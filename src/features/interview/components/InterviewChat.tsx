"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  ArrowRight,
  Headphones,
  Loader2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Difficulty } from "@/types";
import { useInterview, type StartOptions } from "../hooks/useInterview";
import {
  useSpeechRecognition,
  useSpeechSynthesis,
  type VoiceOption,
} from "../hooks/useSpeech";
import { ScoreCard } from "./ScoreCard";
import { InterviewSummary } from "./InterviewSummary";

const DIFFICULTIES: { value: Difficulty | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const COUNTS = [3, 5, 8, 10];

// How long to wait after the user stops speaking before auto-submitting (hands-free).
const SILENCE_MS = 3500;

// Trim spoken feedback to keep neural-TTS cost down (full text stays on screen).
const SPOKEN_FEEDBACK_MAX = 240;
function shortenForSpeech(text: string, maxChars = SPOKEN_FEEDBACK_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const stop = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? ")
  );
  return (stop > 80 ? slice.slice(0, stop + 1) : slice).trim();
}

const primaryBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function sttSupportedNow(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function InterviewChat() {
  const interview = useInterview();
  const tts = useSpeechSynthesis();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  useEffect(() => {
    setSttSupported(sttSupportedNow());
  }, []);

  const voiceOn = voiceEnabled && tts.isSupported;
  const spokenQuestionRef = useRef<string | null>(null);
  const spokenResultRef = useRef<number>(-1);
  const handsFreeRef = useRef(handsFree);
  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  const advance = useCallback(() => {
    tts.cancel();
    interview.next();
  }, [tts, interview]);
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Speak the current question aloud when voice mode is on.
  useEffect(() => {
    if (interview.phase !== "question" || !interview.currentQuestion) return;
    if (!voiceOn) return;
    const key = `${interview.currentIndex}:${interview.currentQuestion._id}`;
    if (spokenQuestionRef.current === key) return;
    spokenQuestionRef.current = key;
    tts.speak(interview.currentQuestion.question);
  }, [interview.phase, interview.currentQuestion, interview.currentIndex, voiceOn, tts]);

  // Speak the score + feedback when an answer has been evaluated; in hands-free
  // mode, auto-advance once the feedback finishes (or after a delay if muted).
  useEffect(() => {
    if (interview.phase !== "result" || !interview.lastResult) return;
    if (spokenResultRef.current === interview.currentIndex) return;
    spokenResultRef.current = interview.currentIndex;

    const r = interview.lastResult;
    const text = `You scored ${r.score} out of 10. ${shortenForSpeech(r.feedback)}`;

    if (voiceOn) {
      tts.speak(text, {
        onEnd: () => {
          if (handsFreeRef.current) advanceRef.current();
        },
      });
    } else if (handsFreeRef.current) {
      const id = setTimeout(() => advanceRef.current(), 4500);
      return () => clearTimeout(id);
    }
  }, [interview.phase, interview.lastResult, interview.currentIndex, voiceOn, tts]);

  // Stop any speech when leaving the voiced phases.
  useEffect(() => {
    if (interview.phase === "config" || interview.phase === "summary") tts.cancel();
  }, [interview.phase, tts]);

  function toggleVoice() {
    if (voiceEnabled) tts.cancel();
    setVoiceEnabled((v) => !v);
  }

  if (interview.phase === "config") {
    return <ConfigScreen onStart={interview.start} isStarting={interview.isStarting} />;
  }

  if (interview.phase === "summary" && interview.finalSession) {
    return <InterviewSummary session={interview.finalSession} onRestart={interview.reset} />;
  }

  // In hands-free mode, start listening once the AI has finished asking.
  const readyToListen = handsFree && (!voiceOn || !tts.isSpeaking);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Header
        current={interview.currentIndex + 1}
        total={interview.questions.length}
        voiceSupported={tts.isSupported}
        voiceEnabled={voiceEnabled}
        isSpeaking={tts.isSpeaking}
        onToggleVoice={toggleVoice}
        voices={tts.voices}
        voiceURI={tts.voiceURI}
        onVoiceChange={tts.setVoiceURI}
        isNeural={tts.provider === "cloud"}
        sttSupported={sttSupported}
        handsFree={handsFree}
        onToggleHandsFree={() => setHandsFree((h) => !h)}
      />

      {interview.currentQuestion && (
        <div className="rounded-xl border border-border bg-card p-5 mt-4">
          <p className="text-xs text-muted-foreground mb-1">
            {interview.currentQuestion.topic} · {interview.currentQuestion.difficulty}
          </p>
          <p className="text-base font-semibold text-foreground">
            {interview.currentQuestion.question}
          </p>
        </div>
      )}

      {interview.phase === "question" && (
        <AnswerForm
          key={interview.currentIndex}
          isSubmitting={interview.isSubmitting}
          onSubmit={interview.submitAnswer}
          onStartSpeaking={tts.cancel}
          handsFree={handsFree}
          autoListen={readyToListen}
        />
      )}

      {interview.phase === "result" && interview.lastResult && (
        <div className="mt-4 space-y-4">
          <ScoreCard result={interview.lastResult} />
          <div className="flex items-center justify-end gap-3">
            {handsFree && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Hands-free: continuing…
              </span>
            )}
            <button onClick={advance} disabled={interview.isCompleting} className={primaryBtn}>
              {interview.isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finishing...
                </>
              ) : interview.isLastQuestion ? (
                <>
                  Finish interview
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next question
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigScreen({
  onStart,
  isStarting,
}: {
  onStart: (opts: StartOptions) => void;
  isStarting: boolean;
}) {
  const [topicId, setTopicId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const [count, setCount] = useState(5);

  const { data } = useSWR<{ success: boolean; data: TopicNode[] }>("/api/topics", topicsFetcher, {
    revalidateOnFocus: false,
  });
  const topics = data?.data ? flattenTopics(data.data).filter((t) => t.questionCount > 0) : [];

  function handleStart() {
    onStart({
      topicId: topicId || undefined,
      difficulty: difficulty === "any" ? undefined : difficulty,
      questionCount: count,
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mock Interview</h1>
          <p className="text-sm text-muted-foreground">
            Speak or type your answers and get instant AI scoring.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Topic</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.questionCount})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                  difficulty === d.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Questions</label>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                  count === c
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleStart} disabled={isStarting} className={cn(primaryBtn, "w-full justify-center")}>
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing your interview...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Start interview
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AnswerForm({
  onSubmit,
  isSubmitting,
  onStartSpeaking,
  handsFree,
  autoListen,
}: {
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
  onStartSpeaking?: () => void;
  handsFree: boolean;
  autoListen: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const trimmed = answer.trim();
  const autoStartedRef = useRef(false);

  const { isSupported, isListening, interimTranscript, start, stop, toggle } = useSpeechRecognition({
    onFinalResult: (text) => {
      setAnswer((prev) => (prev ? `${prev.trim()} ${text}` : text));
    },
  });

  function handleMic() {
    if (!isListening) onStartSpeaking?.(); // stop the AI voice before the user speaks
    toggle();
  }

  // Hands-free: begin listening automatically once the AI finished asking.
  useEffect(() => {
    if (autoListen && isSupported && !isListening && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoListen, isSupported, isListening, start]);

  // Hands-free: auto-submit after a stretch of silence (no new speech).
  useEffect(() => {
    if (!handsFree || !isListening) return;
    const id = setTimeout(() => {
      const t = answer.trim();
      if (t.length > 0) {
        stop();
        onSubmit(t);
      }
    }, SILENCE_MS);
    return () => clearTimeout(id);
  }, [handsFree, isListening, interimTranscript, answer, stop, onSubmit]);

  function handleSubmit() {
    stop();
    onSubmit(trimmed);
  }

  return (
    <div className="mt-4">
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isSubmitting}
          rows={6}
          maxLength={5000}
          placeholder={
            isSupported
              ? "Speak with the mic or type your answer here..."
              : "Type your answer here, as if you were explaining it in the interview..."
          }
          className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-14 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        />
        {isSupported && (
          <button
            type="button"
            onClick={handleMic}
            disabled={isSubmitting}
            title={isListening ? "Stop recording" : "Start recording"}
            className={cn(
              "absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors disabled:opacity-50",
              isListening
                ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                : "border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40"
            )}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      {isListening && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Listening…{" "}
          {interimTranscript && <span className="italic text-foreground/70">{interimTranscript}</span>}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground tabular-nums">{answer.length}/5000</span>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || trimmed.length === 0}
          className={primaryBtn}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit answer
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Header({
  current,
  total,
  voiceSupported,
  voiceEnabled,
  isSpeaking,
  onToggleVoice,
  voices,
  voiceURI,
  onVoiceChange,
  isNeural,
  sttSupported,
  handsFree,
  onToggleHandsFree,
}: {
  current: number;
  total: number;
  voiceSupported: boolean;
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onToggleVoice: () => void;
  voices: VoiceOption[];
  voiceURI: string | null;
  onVoiceChange: (uri: string | null) => void;
  isNeural: boolean;
  sttSupported: boolean;
  handsFree: boolean;
  onToggleHandsFree: () => void;
}) {
  const progress = (current / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <MessageSquare className="w-3.5 h-3.5" />
          Mock Interview
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {voiceSupported && (
            <button
              onClick={onToggleVoice}
              title={voiceEnabled ? "Turn off AI voice" : "Turn on AI voice"}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                voiceEnabled
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
                isSpeaking && voiceEnabled && "animate-pulse"
              )}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {voiceEnabled ? "Voice on" : "Voice off"}
            </button>
          )}
          {sttSupported && (
            <button
              onClick={onToggleHandsFree}
              title="Hands-free: listen and submit automatically"
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                handsFree
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Headphones className="w-3.5 h-3.5" />
              {handsFree ? "Hands-free on" : "Hands-free"}
            </button>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            Question {current} of {total}
          </span>
        </div>
      </div>

      {voiceSupported && voiceEnabled && voices.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1.5">
            AI voice
            {isNeural && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Neural
              </span>
            )}
          </label>
          <select
            value={voiceURI ?? ""}
            onChange={(e) => onVoiceChange(e.target.value || null)}
            className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground max-w-[260px] focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Default</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

interface TopicNode {
  _id: string;
  name: string;
  questionCount: number;
  children?: TopicNode[];
}

const topicsFetcher = async (url: string): Promise<{ success: boolean; data: TopicNode[] }> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
};

function flattenTopics(nodes: TopicNode[]): TopicNode[] {
  const out: TopicNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flattenTopics(n.children));
  }
  return out;
}
