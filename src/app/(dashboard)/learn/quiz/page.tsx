"use client";

import { GraduationCap } from "lucide-react";
import { TopicPicker } from "@/features/learning-modes/components/TopicPicker";

export default function QuizModeLandingPage() {
  return (
    <TopicPicker
      basePath="/learn/quiz"
      icon={<GraduationCap className="w-5 h-5 text-primary" />}
      title="Quiz Mode"
      description="Pick a topic to take an AI-generated multiple-choice quiz."
    />
  );
}
