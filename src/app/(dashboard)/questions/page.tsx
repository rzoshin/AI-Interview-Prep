"use client";

import { useEffect } from "react";
import { useQuestionStore } from "@/features/questions/store/question.store";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { TopicSidebar } from "@/features/questions/components/TopicSidebar";
import { QuestionList } from "@/features/questions/components/QuestionList";
import { Filters } from "@/features/questions/components/Filters";
import { Pagination } from "@/features/questions/components/Pagination";

export default function QuestionsPage() {
  const { topicId, difficulty, search, tags, page, setPage } = useQuestionStore();

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
    </div>
  );
}
