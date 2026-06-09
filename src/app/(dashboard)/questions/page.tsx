"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useQuestionStore } from "@/features/questions/store/question.store";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { TopicSidebar } from "@/features/questions/components/TopicSidebar";
import { QuestionList } from "@/features/questions/components/QuestionList";
import { Filters } from "@/features/questions/components/Filters";
import { Pagination } from "@/features/questions/components/Pagination";

export default function QuestionsPage() {
  const { topicId, difficulty, search, tags, page, setPage } = useQuestionStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount =
    (topicId ? 1 : 0) + (difficulty ? 1 : 0) + tags.length + (search ? 1 : 0);

  const { questions, meta, isLoading } = useQuestions({
    topicId: topicId || undefined,
    difficulty: difficulty || undefined,
    search: search || undefined,
    tags: tags.length ? tags : undefined,
    page,
    limit: 20,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, difficulty, search, tags.join(",")]);

  return (
    <div className="flex h-full min-h-0">
      {/* Topic sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border p-4 overflow-y-auto scrollbar-thin">
        <TopicSidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto w-full">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Question Explorer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse, search and bookmark interview questions
            </p>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent xl:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Topics & filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Stats bar */}
          {meta && (
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>
                {meta.total.toLocaleString()} question{meta.total !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </span>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
            </div>
          )}

          {/* Question grid */}
          <QuestionList questions={questions} isLoading={isLoading} />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Filter panel */}
      <aside className="hidden xl:block w-64 shrink-0 border-l border-border p-4 overflow-y-auto scrollbar-thin">
        <Filters />
      </aside>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close topics and filters"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-question-filters-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div>
                <h2 id="mobile-question-filters-title" className="font-semibold text-foreground">
                  Topics & filters
                </h2>
                <p className="text-xs text-muted-foreground">Refine the questions list</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close topics and filters"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <div className="space-y-6">
                <TopicSidebar />
                <div className="border-t border-border pt-6">
                  <Filters />
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
