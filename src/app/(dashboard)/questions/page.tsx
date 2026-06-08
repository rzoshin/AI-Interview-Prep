import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata = { title: "Questions" };

export default function QuestionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Question Explorer</h1>
        <p className="text-muted-foreground">Coming in Phase 3.</p>
      </div>
    </Suspense>
  );
}
