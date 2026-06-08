import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

export const metadata = { title: "Quiz Mode" };

export default function QuizModeLandingPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Quiz Mode</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Quiz Mode tests you with timed multiple-choice questions generated from a
          question's content. Pick a question from the explorer to start a quiz on it.
        </p>
        <Link
          href="/questions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Browse Questions
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-muted-foreground/70 mt-4">
          The full timed quiz experience arrives in Phase 5.
        </p>
      </div>
    </div>
  );
}
