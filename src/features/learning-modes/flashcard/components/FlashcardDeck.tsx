"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFlashcards } from "../hooks/useFlashcards";
import { Flashcard } from "./Flashcard";

interface FlashcardDeckProps {
  topicId: string;
}

export function FlashcardDeck({ topicId }: FlashcardDeckProps) {
  const { cards, topicName, isLoading, error } = useFlashcards(topicId);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const total = cards.length;

  const go = useCallback(
    (dir: number) => {
      setDirection(dir);
      setIndex((i) => {
        const next = i + dir;
        if (next < 0 || next >= total) return i;
        return next;
      });
    },
    [total]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-80 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/learn/flashcards" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          All decks
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <Layers className="w-3.5 h-3.5" />
          {topicName ? `${topicName} Flashcards` : "Flashcards"}
        </span>
      </div>

      {error || total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "No questions found for this topic yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={cards[index]._id}
                custom={direction}
                initial={{ opacity: 0, x: direction >= 0 ? 80 : -80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction >= 0 ? -80 : 80 }}
                transition={{ duration: 0.25 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(1);
                  else if (info.offset.x > 80) go(-1);
                }}
              >
                <Flashcard
                  questionId={cards[index]._id}
                  questionText={cards[index].question}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              className={cn(navBtn, index === 0 && "opacity-40 cursor-not-allowed")}
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {index + 1} / {total}
            </span>
            <button
              onClick={() => go(1)}
              disabled={index === total - 1}
              className={cn(navBtn, index === total - 1 && "opacity-40 cursor-not-allowed")}
              aria-label="Next card"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const navBtn =
  "inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors";
