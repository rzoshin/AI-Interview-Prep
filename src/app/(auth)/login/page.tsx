import { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthHero } from "@/features/auth/components/AuthHero";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Interview Prep Platform account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      <AuthHero />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 gradient-mesh">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">InterviewPrep</span>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
