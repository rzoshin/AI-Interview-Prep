import Link from "next/link";
import { Brain } from "lucide-react";

export function AuthHero() {
  return (
    <div className="hidden lg:flex lg:flex-1 flex-col justify-between bg-gradient-to-br from-primary via-primary to-violet-600 p-12">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-xl text-white">InterviewPrep</span>
      </Link>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white leading-tight">
          Master your next
          <br />
          technical interview
        </h1>
        <p className="text-white/80 text-lg max-w-md">
          Write your own answers, get AI feedback, practice mock interviews, and track your
          readiness — all in one platform.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Questions", value: "500+" },
          { label: "Topics", value: "20+" },
          { label: "AI Modes", value: "5" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/10 backdrop-blur p-4">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-white/70 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
