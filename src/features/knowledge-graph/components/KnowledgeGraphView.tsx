"use client";

import dynamic from "next/dynamic";

const KnowledgeGraphCanvas = dynamic(
  () =>
    import("@/features/knowledge-graph/components/KnowledgeGraphCanvas").then(
      (m) => m.KnowledgeGraphCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-muted-foreground">
        Loading graph…
      </div>
    ),
  }
);

export function KnowledgeGraphView() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore topic relationships. Click a node to jump to its questions.
        </p>
      </div>
      <KnowledgeGraphCanvas />
    </div>
  );
}
