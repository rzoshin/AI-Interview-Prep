"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuestionStore } from "@/features/questions/store/question.store";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { QuestionList } from "@/features/questions/components/QuestionList";
import { Filters } from "@/features/questions/components/Filters";
import { Pagination } from "@/features/questions/components/Pagination";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ITopic } from "@/types/index";

interface TopicDetail extends ITopic {
  questionCount: number;
}

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [topicData, setTopicData] = useState<TopicDetail | null>(null);
  const [topicLoading, setTopicLoading] = useState(true);

  const { difficulty, search, tags, page, setPage, setTopicId } = useQuestionStore();

  // Sync topic ID into store when slug resolves
  useEffect(() => {
    if (!slug) return;
    setTopicLoading(true);
    fetch(`/api/topics/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setTopicData(json.data);
          setTopicId(json.data._id);
        }
      })
      .catch(() => {})
      .finally(() => setTopicLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const { questions, meta, isLoading } = useQuestions({
    topicId: topicData?._id,
    difficulty: difficulty || undefined,
    search: search || undefined,
    tags: tags.length ? tags : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="flex h-full min-h-0">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto w-full">
          {/* Back link */}
          <Link
            href="/questions"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Questions
          </Link>

          {/* Topic header */}
          {topicLoading ? (
            <div className="mb-6 space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-72 bg-muted animate-pulse rounded" />
            </div>
          ) : topicData ? (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{topicData.name}</h1>
                  {topicData.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{topicData.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {topicData.questionCount} question{topicData.questionCount !== 1 ? "s" : ""}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Topic not found</h1>
            </div>
          )}

          {/* Stats bar */}
          {meta && !topicLoading && (
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>
                {meta.total.toLocaleString()} result{meta.total !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </span>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
            </div>
          )}

          {/* Question grid */}
          <QuestionList questions={questions} isLoading={isLoading || topicLoading} />

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
