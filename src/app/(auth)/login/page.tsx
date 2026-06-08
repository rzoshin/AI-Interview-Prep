import { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import Link from "next/link";
import { Brain } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Interview Prep Platform account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between bg-gradient-to-br from-primary/90 to-primary p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">InterviewPrep</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Master your next
            <br />
            technical interview
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            AI-powered learning paths, instant explanations, mock interviews, and personalized
            progress tracking — all in one platform.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Questions", value: "500+" },
            { label: "Topics", value: "20+" },
            { label: "Users", value: "10K+" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">InterviewPrep</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
