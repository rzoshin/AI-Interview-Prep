"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Hash, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useQuestionStore } from "../store/question.store";
import type { ITopic } from "@/types/index";

interface TopicWithChildren extends ITopic {
  children?: TopicWithChildren[];
}

interface TopicNodeProps {
  topic: TopicWithChildren;
  depth?: number;
}

function TopicNode({ topic, depth = 0 }: TopicNodeProps) {
  const { topicId, setTopicId } = useQuestionStore();
  const [open, setOpen] = useState(false);
  const hasChildren = (topic.children?.length ?? 0) > 0;
  const isActive = topicId === topic._id;

  return (
    <div>
      <button
        onClick={() => {
          setTopicId(isActive ? "" : topic._id);
          if (hasChildren) setOpen((o) => !o);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground",
          depth > 0 && "ml-3"
        )}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <Hash className="w-3.5 h-3.5 shrink-0 opacity-50" />
        )}
        <span className="flex-1 truncate">{topic.name}</span>
        {topic.questionCount > 0 && (
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full shrink-0",
              isActive
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {topic.questionCount}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {hasChildren && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {topic.children!.map((child) => (
              <TopicNode key={child._id} topic={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopicSidebar() {
  const [topics, setTopics] = useState<TopicWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const { topicId, setTopicId } = useQuestionStore();

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTopics(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="flex flex-col gap-1 min-h-0">
      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="w-4 h-4" />
          Topics
        </div>
        {topicId && (
          <button
            onClick={() => setTopicId("")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-1 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <p className="px-3 text-sm text-muted-foreground">No topics yet.</p>
      ) : (
        <div className="space-y-0.5 overflow-y-auto flex-1 scrollbar-thin">
          <button
            onClick={() => setTopicId("")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              "hover:bg-accent hover:text-accent-foreground",
              !topicId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Hash className="w-3.5 h-3.5 shrink-0 opacity-50" />
            All Topics
          </button>
          {topics.map((topic) => (
            <TopicNode key={topic._id} topic={topic} />
          ))}
        </div>
      )}
    </aside>
  );
}
