import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { AuthHero } from "@/features/auth/components/AuthHero";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Interview Prep Platform account",
};

export default function RegisterPage() {
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
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
