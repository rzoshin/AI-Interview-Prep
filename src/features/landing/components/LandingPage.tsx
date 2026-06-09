import Link from "next/link";
import {
  Brain,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Map,
  Network,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Question Explorer",
    description: "Browse hundreds of interview questions by topic, difficulty, and tags.",
  },
  {
    icon: Sparkles,
    title: "AI Answer Engine",
    description: "Layered explanations from ELI5 to senior-level with code examples and quizzes.",
  },
  {
    icon: GraduationCap,
    title: "Study & Quiz Modes",
    description: "Write your own answers, get AI feedback, and test yourself with timed quizzes.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    description: "Quick revision with interactive flip cards for active recall.",
  },
  {
    icon: MessageSquare,
    title: "Mock Interview",
    description: "Practice with AI-generated follow-ups and instant scoring.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Track readiness, mastery, streaks, and weak areas over time.",
  },
  {
    icon: Map,
    title: "Smart Roadmap",
    description: "Personalized learning path based on your performance.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description: "Visual map of topic relationships colored by your mastery.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">InterviewPrep</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="gradient-mesh relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-powered interview preparation
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Master your next
            <span className="block bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              technical interview
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Practice questions, write your own answers with AI feedback, take quizzes, run mock
            interviews, and track your readiness — all in one platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to prepare</h2>
            <p className="mt-3 text-muted-foreground">
              From first study session to interview-ready confidence
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to level up?</h2>
          <p className="mt-3 text-muted-foreground">
            Join InterviewPrep and start building interview confidence today.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            InterviewPrep
          </div>
          <p className="text-sm text-muted-foreground">
            Built for developers preparing for technical interviews.
          </p>
        </div>
      </footer>
    </div>
  );
}
