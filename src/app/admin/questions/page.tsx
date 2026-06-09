"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { IQuestion, ITopic } from "@/types/index";

interface QuestionRow extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
}

interface FlatTopic {
  _id: string;
  name: string;
}

interface EditModalProps {
  question: QuestionRow;
  onClose: () => void;
  onSave: (id: string, data: Partial<QuestionRow>) => Promise<void>;
}

const LIMIT = 20;

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [difficulty, setDifficulty] = useState<"" | "easy" | "medium" | "hard">("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionRow | null>(null);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [topics, setTopics] = useState<FlatTopic[]>([]);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (search) qs.set("search", search);
      if (difficulty) qs.set("difficulty", difficulty);

      const res = await fetch(`/api/questions?${qs.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data);
        setTotal(json.meta?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const flat: FlatTopic[] = [];
        function walk(nodes: Array<{ _id: string; name: string; children?: typeof nodes }>) {
          for (const n of nodes) {
            flat.push({ _id: n._id, name: n.name });
            if (n.children?.length) walk(n.children);
          }
        }
        walk(json.data ?? []);
        setTopics(flat);
      });
  }, []);

  async function togglePublish(q: QuestionRow) {
    setTogglingId(q._id);
    try {
      await fetch(`/api/questions/${q._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !q.isPublished }),
      });
      setQuestions((prev) =>
        prev.map((item) =>
          item._id === q._id ? { ...item, isPublished: !q.isPublished } : item
        )
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/questions/${id}`, { method: "DELETE" });
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave(id: string, data: Partial<QuestionRow>) {
    await fetch(`/api/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setQuestions((prev) =>
      prev.map((q) => (q._id === id ? { ...q, ...data } : q))
    );
    setEditingQuestion(null);
  }

  async function regenerateAnswer(id: string) {
    setRegeneratingId(id);
    try {
      const res = await fetch(`/api/ai/generate/${id}?force=true`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Regeneration failed");
      toast.success("AI answer regenerated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleCreate(data: {
    topic: string;
    question: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    isPublished: boolean;
  }) {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Create failed");
    setCreatingQuestion(false);
    toast.success("Question created");
    fetchQuestions();
  }

  const topicName = (q: QuestionRow) =>
    typeof q.topic === "object" && q.topic !== null
      ? (q.topic as ITopic).name
      : "Unknown";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString()} total questions
          </p>
        </div>
        <button
          onClick={() => setCreatingQuestion(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {(["", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                difficulty === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {d === "" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Question</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">Topic</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Difficulty</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No questions found.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr
                    key={q._id}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/10 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-sm">
                      <p className="line-clamp-2 text-foreground">{q.question}</p>
                      {q.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {q.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{topicName(q)}</td>
                    <td className="px-4 py-3">
                      <DifficultyBadge difficulty={q.difficulty} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          q.isPublished
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {q.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => regenerateAnswer(q._id)}
                          disabled={regeneratingId === q._id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Regenerate AI answer"
                        >
                          {regeneratingId === q._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => togglePublish(q)}
                          disabled={togglingId === q._id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title={q.isPublished ? "Unpublish" : "Publish"}
                        >
                          {togglingId === q._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : q.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(q._id)}
                          disabled={deletingId === q._id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          {deletingId === q._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-foreground">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {creatingQuestion && (
        <CreateModal
          topics={topics}
          onClose={() => setCreatingQuestion(false)}
          onCreate={handleCreate}
        />
      )}

      {editingQuestion && (
        <EditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) {
  const config = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config[difficulty])}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

function CreateModal({
  topics,
  onClose,
  onCreate,
}: {
  topics: FlatTopic[];
  onClose: () => void;
  onCreate: (data: {
    topic: string;
    question: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    isPublished: boolean;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    topic: topics[0]?._id ?? "",
    question: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    tags: "",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreate({
        topic: form.topic,
        question: form.question,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isPublished: form.isPublished,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">New Question</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <select
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            >
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Question</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              rows={3}
              required
              minLength={10}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="javascript, react"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm">Published</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ question, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({
    question: question.question,
    difficulty: question.difficulty,
    tags: question.tags.join(", "),
    isPublished: question.isPublished,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(question._id, {
      question: form.question,
      difficulty: form.difficulty,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPublished: form.isPublished,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Edit Question</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Question</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              rows={3}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="javascript, react, hooks"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">Published</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
