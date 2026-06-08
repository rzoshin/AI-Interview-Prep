"use client";

import { Layers } from "lucide-react";
import { TopicPicker } from "@/features/learning-modes/components/TopicPicker";

export default function FlashcardsLandingPage() {
  return (
    <TopicPicker
      basePath="/learn/flashcards"
      icon={<Layers className="w-5 h-5 text-primary" />}
      title="Flashcards"
      description="Pick a topic to start a flashcard deck."
    />
  );
}
