"use client";

import Link from "next/link";
import useSWR from "swr";
import { ChevronRight } from "lucide-react";

interface TopicNode {
  _id: string;
  name: string;
  questionCount: number;
  children?: TopicNode[];
}

interface TopicsResponse {
  success: boolean;
  data: TopicNode[];
}

interface TopicPickerProps {
  basePath: string; // e.g. "/learn/quiz" or "/learn/flashcards"
  icon: React.ReactNode;
  title: string;
  description: string;
}

const fetcher = async (url: string): Promise<TopicsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
};

// Flattens the topic hierarchy into a single list.
function flatten(nodes: TopicNode[]): TopicNode[] {
  const out: TopicNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flatten(n.children));
  }
  return out;
}

export function TopicPicker({ basePath, icon, title, description }: TopicPickerProps) {
  const { data, isLoading } = useSWR<TopicsResponse>("/api/topics", fetcher, {
    revalidateOnFocus: false,
  });

  const topics = data?.data ? flatten(data.data).filter((t) => t.questionCount > 0) : [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No topics with questions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Link
              key={topic._id}
              href={`${basePath}/${topic._id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{topic.name}</p>
                <p className="text-xs text-muted-foreground">
                  {topic.questionCount} question{topic.questionCount !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
