"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCw } from "lucide-react";
import type { IAIAnswer } from "@/types/index";

interface FlashcardProps {
  questionId: string;
  questionText: string;
}

interface AnswerResponse {
  success: boolean;
  data: IAIAnswer | null;
}

export function Flashcard({ questionId, questionText }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState<IAIAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset when the card changes.
  useEffect(() => {
    setFlipped(false);
    setAnswer(null);
    setLoaded(false);
  }, [questionId]);

  // Lazily fetch the answer the first time the card is flipped to the back.
  // NOTE: `loading` must NOT be a dependency — toggling it would re-run this
  // effect, whose cleanup cancels the in-flight request and leaves it stuck.
  useEffect(() => {
    if (!flipped || loaded) return;
    let active = true;
    setLoading(true);
    fetch(`/api/ai/answers/${questionId}`)
      .then((r) => r.json())
      .then((json: AnswerResponse) => {
        if (active) setAnswer(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [flipped, loaded, questionId]);

  const backText = answer?.interview_answer || answer?.beginner_answer || "";

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="relative block w-full h-96 rounded-2xl border border-border/80 bg-card/90 backdrop-blur shadow-lg hover:shadow-xl transition-shadow p-8 text-left cursor-pointer select-none overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!flipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Question</span>
            <p className="text-lg font-semibold text-foreground leading-relaxed">{questionText}</p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-6">
              <RotateCw className="w-3.5 h-3.5" />
              Tap to flip
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col p-8 overflow-y-auto scrollbar-thin"
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Answer</span>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : backText ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{backText}</p>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <p className="text-sm text-muted-foreground">No AI answer generated yet.</p>
                <Link
                  href={`/learn/study/${questionId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-primary hover:underline"
                >
                  Generate it in Study Mode
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
