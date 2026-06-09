"use client";

import { Brain } from "lucide-react";
import { ModeQuestionPicker } from "@/features/learning-modes/components/ModeQuestionPicker";

export default function StudyModeLandingPage() {
  return (
    <ModeQuestionPicker
      basePath="/learn/study"
      icon={<Brain className="w-6 h-6 text-primary" />}
      title="Study Mode"
      description="Pick a question, write your own answer, get AI feedback, then review layered explanations."
      ctaLabel="Study"
    />
  );
}
