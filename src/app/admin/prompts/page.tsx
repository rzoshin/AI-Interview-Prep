"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IPrompt } from "@/types";

const PROMPT_NAMES = ["answer", "quiz", "interview", "roadmap"] as const;
const AI_MODELS = ["gpt-5", "claude", "gemini"] as const;

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IPrompt | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts");
      const json = await res.json();
      if (json.success) setPrompts(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this prompt version?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
      setPrompts((prev) => prev.filter((p) => p._id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetActive(prompt: IPrompt) {
    await fetch(`/api/admin/prompts/${prompt._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setPrompts((prev) =>
      prev.map((p) =>
        p.name === prompt.name
          ? { ...p, isActive: p._id === prompt._id }
          : p
      )
    );
  }

  const grouped = PROMPT_NAMES.map((name) => ({
    name,
    items: prompts.filter((p) => p.name === name),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Prompts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Versioned system prompts used by the AI engine. One active version per name.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Version
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ name, items }) => (
            <section key={name}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {name}
              </h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                  No versions yet — file-based fallback is used.
                </p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Version</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Length</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p._id} className="border-b border-border/50 last:border-0 hover:bg-accent/10">
                          <td className="px-4 py-3 font-mono text-xs">{p.version}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.aiModel}</td>
                          <td className="px-4 py-3">
                            {p.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetActive(p)}
                                className="text-xs text-primary hover:underline"
                              >
                                Set active
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">
                            {p.content.length.toLocaleString()} chars
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditing(p)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                disabled={deletingId === p._id || p.isActive}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                title={p.isActive ? "Cannot delete active prompt" : "Delete"}
                              >
                                {deletingId === p._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <PromptModal
          prompt={editing}
          existingVersions={prompts.filter((p) => p.name === (editing?.name ?? "answer"))}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            fetchPrompts();
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </div>
  );
}

interface PromptModalProps {
  prompt: IPrompt | null;
  existingVersions: IPrompt[];
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

function PromptModal({
  prompt,
  existingVersions,
  onClose,
  onSaved,
  saving,
  setSaving,
}: PromptModalProps) {
  const isEdit = !!prompt;

  const [form, setForm] = useState({
    name: prompt?.name ?? "answer",
    content: prompt?.content ?? "",
    aiModel: prompt?.aiModel ?? "gpt-5",
    version: prompt?.version ?? suggestNextVersion(existingVersions),
    isActive: prompt?.isActive ?? true,
  });

  function suggestNextVersion(versions: IPrompt[]): string {
    if (versions.length === 0) return "v1";
    const latest = versions[0]?.version ?? "v1";
    const match = latest.match(/^v(\d+)$/i);
    return match ? `v${parseInt(match[1], 10) + 1}` : `${latest}-next`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/prompts/${prompt._id}` : "/api/admin/prompts";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { content: form.content, aiModel: form.aiModel, version: form.version, isActive: form.isActive }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold">{isEdit ? "Edit Prompt" : "New Prompt Version"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prompt name</label>
              <select
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    version: suggestNextVersion(
                      existingVersions.filter((v) => v.name === e.target.value)
                    ),
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
              >
                {PROMPT_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Version</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">AI model</label>
              <select
                value={form.aiModel}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    aiModel: e.target.value as (typeof AI_MODELS)[number],
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
              >
                {AI_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">System prompt content</label>
              <span className="text-xs text-muted-foreground">{form.content.length} chars</span>
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={14}
              required
              minLength={20}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm">Set as active version</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              )}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Create version"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
