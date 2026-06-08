"use client";

import { Brain } from "lucide-react";
import { ModeQuestionPicker } from "@/features/learning-modes/components/ModeQuestionPicker";

export default function StudyModeLandingPage() {
  return (
    <ModeQuestionPicker
      basePath="/learn/study"
      icon={<Brain className="w-5 h-5 text-primary" />}
      title="Study Mode"
      description="Pick a question to study with layered explanations (ELI5 to senior level)."
      ctaLabel="Study"
    />
  );
}
