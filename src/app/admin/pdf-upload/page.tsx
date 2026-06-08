"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Import,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ExtractedQuestion } from "@/services/pdf.service";

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "failed";

interface UploadRecord {
  uploadId: string;
  fileName: string;
  status: UploadStatus;
  extractedCount?: number;
  errorMessage?: string;
  questions?: ExtractedQuestion[];
  selectedIds: Set<number>;
  expanded: boolean;
}

export default function AdminPDFUploadPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const updateUpload = useCallback(
    (uploadId: string, patch: Partial<UploadRecord>) => {
      setUploads((prev) =>
        prev.map((u) => (u.uploadId === uploadId ? { ...u, ...patch } : u))
      );
    },
    []
  );

  const pollStatus = useCallback(
    (uploadId: string) => {
      const timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/pdf/${uploadId}/status`);
          const json = await res.json();
          if (!json.success) return;

          const { status, extractedCount, errorMessage } = json.data;

          if (status === "done" || status === "failed") {
            clearInterval(timer);
            pollTimers.current.delete(uploadId);

            if (status === "done") {
              // Fetch extracted questions
              const extractRes = await fetch(`/api/admin/pdf/${uploadId}/status`, {
                method: "POST",
              });
              const extractJson = await extractRes.json();
              const questions: ExtractedQuestion[] = extractJson.data?.questions ?? [];

              updateUpload(uploadId, {
                status: "done",
                extractedCount,
                questions,
                selectedIds: new Set(
                  questions
                    .map((_, i) => i)
                    .filter((i) => !questions[i].isDuplicate)
                ),
                expanded: true,
              });
            } else {
              updateUpload(uploadId, { status: "failed", errorMessage });
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 5000);

      pollTimers.current.set(uploadId, timer);
    },
    [updateUpload]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = pollTimers.current;
    return () => {
      timers.forEach((t) => clearInterval(t));
    };
  }, []);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("File must be under 20MB.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setUploads((prev) => [
      {
        uploadId: tempId,
        fileName: file.name,
        status: "uploading",
        selectedIds: new Set(),
        expanded: false,
      },
      ...prev,
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/pdf", { method: "POST", body: formData });
      const json = await res.json();

      if (!json.success) throw new Error(json.error ?? "Upload failed");

      const { uploadId } = json.data;

      setUploads((prev) =>
        prev.map((u) =>
          u.uploadId === tempId
            ? { ...u, uploadId, status: "processing" }
            : u
        )
      );

      pollStatus(uploadId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploads((prev) =>
        prev.map((u) =>
          u.uploadId === tempId
            ? { ...u, status: "failed", errorMessage: message }
            : u
        )
      );
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function toggleQuestion(uploadId: string, index: number) {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.uploadId !== uploadId) return u;
        const selectedIds = new Set(u.selectedIds);
        if (selectedIds.has(index)) selectedIds.delete(index);
        else selectedIds.add(index);
        return { ...u, selectedIds };
      })
    );
  }

  function toggleAll(uploadId: string, questions: ExtractedQuestion[]) {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.uploadId !== uploadId) return u;
        const nonDups = questions
          .map((_, i) => i)
          .filter((i) => !questions[i].isDuplicate);
        const allSelected = nonDups.every((i) => u.selectedIds.has(i));
        return {
          ...u,
          selectedIds: allSelected
            ? new Set<number>()
            : new Set<number>(nonDups),
        };
      })
    );
  }

  async function handleBulkImport(record: UploadRecord) {
    if (!record.questions || record.selectedIds.size === 0) return;

    setImportingId(record.uploadId);
    try {
      const selected = Array.from(record.selectedIds).map(
        (i) => record.questions![i]
      );
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: record.uploadId, questions: selected }),
      });
      const json = await res.json();

      if (json.success) {
        const { imported, skipped } = json.data;
        alert(`Imported ${imported} questions. Skipped ${skipped} duplicates.`);
        updateUpload(record.uploadId, { selectedIds: new Set() });
      } else {
        alert(`Import failed: ${json.error}`);
      }
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">PDF Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload question PDFs to extract and review interview questions
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Upload className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop a PDF here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF files up to 20MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { handleFile(file); e.target.value = ""; }
          }}
        />
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Uploads</h2>
          {uploads.map((record) => (
            <UploadCard
              key={record.uploadId}
              record={record}
              onToggle={toggleQuestion}
              onToggleAll={toggleAll}
              onImport={handleBulkImport}
              onExpand={(id) => updateUpload(id, { expanded: !record.expanded })}
              isImporting={importingId === record.uploadId}
              onDelete={(id) => setUploads((prev) => prev.filter((u) => u.uploadId !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadCardProps {
  record: UploadRecord;
  onToggle: (uploadId: string, index: number) => void;
  onToggleAll: (uploadId: string, questions: ExtractedQuestion[]) => void;
  onImport: (record: UploadRecord) => void;
  onExpand: (id: string) => void;
  isImporting: boolean;
  onDelete: (id: string) => void;
}

function UploadCard({
  record,
  onToggle,
  onToggleAll,
  onImport,
  onExpand,
  isImporting,
  onDelete,
}: UploadCardProps) {
  const nonDuplicates = (record.questions ?? []).filter((q) => !q.isDuplicate);

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{record.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {record.status === "uploading" && "Uploading…"}
            {record.status === "processing" && (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Extracting questions…
              </span>
            )}
            {record.status === "done" &&
              `${record.extractedCount ?? 0} questions extracted`}
            {record.status === "failed" && (record.errorMessage ?? "Failed")}
          </p>
        </div>

        <StatusBadge status={record.status} />

        {record.status === "done" && record.questions && (
          <button
            onClick={() => onExpand(record.uploadId)}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
          >
            {record.expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          onClick={() => onDelete(record.uploadId)}
          className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors text-muted-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Extracted questions table */}
      {record.expanded && record.questions && record.questions.length > 0 && (
        <div className="border-t border-border">
          {/* Bulk actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  nonDuplicates.length > 0 &&
                  nonDuplicates.every((_, i) => {
                    const idx = record.questions!.indexOf(nonDuplicates[i]);
                    return record.selectedIds.has(idx);
                  })
                }
                onChange={() => onToggleAll(record.uploadId, record.questions!)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground">
                {record.selectedIds.size} of {nonDuplicates.length} selected
              </span>
            </div>
            <button
              onClick={() => onImport(record)}
              disabled={record.selectedIds.size === 0 || isImporting}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                record.selectedIds.size > 0 && !isImporting
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Import className="w-3.5 h-3.5" />
              )}
              Import selected
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="w-8 px-4 py-2" />
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Question</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-28">Topic</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-20">Difficulty</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {record.questions.map((q, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border/50 last:border-0 transition-colors",
                      q.isDuplicate
                        ? "opacity-50"
                        : "hover:bg-accent/20 cursor-pointer"
                    )}
                    onClick={() => !q.isDuplicate && onToggle(record.uploadId, i)}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={record.selectedIds.has(i)}
                        disabled={q.isDuplicate}
                        onChange={() => !q.isDuplicate && onToggle(record.uploadId, i)}
                        className="w-3.5 h-3.5 rounded accent-primary"
                      />
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <p className="line-clamp-2 text-foreground">{q.question}</p>
                      {q.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {q.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-muted-foreground bg-muted/60 px-1 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{q.topic}</td>
                    <td className="px-4 py-2.5">
                      <DifficultyBadge difficulty={q.difficulty} />
                    </td>
                    <td className="px-4 py-2.5">
                      {q.isDuplicate ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Duplicate
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: UploadStatus }) {
  const config = {
    idle: { label: "Idle", className: "bg-muted text-muted-foreground", icon: null },
    uploading: {
      label: "Uploading",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    processing: {
      label: "Processing",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    done: {
      label: "Done",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    failed: {
      label: "Failed",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const c = config[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
        c.className
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) {
  const config = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full font-medium", config[difficulty])}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}
