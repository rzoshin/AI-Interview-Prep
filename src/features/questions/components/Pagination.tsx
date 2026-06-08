"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "p-2 rounded-lg border border-border transition-colors",
          page <= 1
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "min-w-[36px] h-9 px-2 rounded-lg text-sm border transition-colors",
              page === p
                ? "bg-primary text-primary-foreground border-primary font-medium"
                : "border-border hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "p-2 rounded-lg border border-border transition-colors",
          page >= totalPages
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | "...")[] = [1];

  if (current > 3) result.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    result.push(p);
  }
  if (current < total - 2) result.push("...");
  result.push(total);

  return result;
}
