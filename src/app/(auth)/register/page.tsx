import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import Link from "next/link";
import { Brain } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Interview Prep Platform account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg">InterviewPrep</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
