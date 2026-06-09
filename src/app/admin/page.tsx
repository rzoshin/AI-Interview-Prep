"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, BookOpen, MessageSquare, Loader2 } from "lucide-react";

interface AdminStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  pendingPdfUploads: number;
  totalTopics: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total Questions", value: stats.totalQuestions },
        { label: "Published", value: stats.publishedQuestions },
        { label: "Draft / Pending Review", value: stats.draftQuestions },
        { label: "PDFs Processing", value: stats.pendingPdfUploads },
        { label: "Topics", value: stats.totalTopics },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your platform content and settings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-3" />
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              </div>
            ))
          : cards.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
              </div>
            ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: "/admin/pdf-upload",
              icon: UploadCloud,
              label: "PDF Upload",
              desc: "Upload and import questions from PDFs",
            },
            {
              href: "/admin/questions",
              icon: BookOpen,
              label: "Questions",
              desc: "Edit, publish, and regenerate AI answers",
            },
            {
              href: "/admin/prompts",
              icon: MessageSquare,
              label: "AI Prompts",
              desc: "Manage versioned system prompts",
            },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-border bg-card p-5 hover:bg-accent/30 transition-colors group"
            >
              <Icon className="w-5 h-5 text-primary mb-3" />
              <p className="font-semibold group-hover:text-primary transition-colors">{label}</p>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading stats…
        </div>
      )}
    </div>
  );
}
