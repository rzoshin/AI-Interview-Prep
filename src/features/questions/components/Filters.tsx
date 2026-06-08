"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useQuestionStore } from "../store/question.store";
import type { Difficulty } from "@/types/index";

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

const COMMON_TAGS = [
  "javascript", "typescript", "react", "node.js", "css", "html",
  "algorithms", "data-structures", "system-design", "database",
  "api", "async", "oop", "functional", "testing", "security",
];

export function Filters() {
  const {
    search,
    difficulty,
    tags,
    setSearch,
    setDifficulty,
    setTags,
    resetFilters,
  } = useQuestionStore();

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  }

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  }

  function toggleDifficulty(d: Difficulty) {
    setDifficulty(difficulty === d ? "" : d);
  }

  const activeCount =
    (difficulty ? 1 : 0) + tags.length + (search ? 1 : 0);

  const difficultyColors: Record<Difficulty, string> = {
    easy: "border-emerald-500 bg-emerald-500 text-white",
    medium: "border-amber-500 bg-amber-500 text-white",
    hard: "border-rose-500 bg-rose-500 text-white",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search questions..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={cn(
            "w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "placeholder:text-muted-foreground transition-colors"
          )}
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Difficulty
        </p>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => toggleDifficulty(value)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all",
                difficulty === value
                  ? difficultyColors[value]
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "text-xs px-2 py-1 rounded-md border transition-all",
                tags.includes(tag)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <button
            onClick={() => setTags([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear tags
          </button>
        )}
      </div>
    </div>
  );
}
