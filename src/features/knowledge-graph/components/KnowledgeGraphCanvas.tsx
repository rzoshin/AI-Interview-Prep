"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { Loader2 } from "lucide-react";
import { TopicNode, type TopicNodeData } from "./TopicNode";
import { useKnowledgeGraph } from "../hooks/useKnowledgeGraph";
import type { MasteryLevel } from "@/services/knowledge-graph.service";

const nodeTypes = { topic: TopicNode };

const LEGEND: { level: MasteryLevel; label: string; className: string }[] = [
  { level: "none", label: "Not started", className: "bg-muted border-muted-foreground/30" },
  { level: "weak", label: "Weak (<50%)", className: "bg-rose-500/20 border-rose-400/60" },
  { level: "building", label: "Building (50–74%)", className: "bg-amber-500/20 border-amber-400/60" },
  { level: "strong", label: "Strong (75%+)", className: "bg-emerald-500/20 border-emerald-400/60" },
];

export function KnowledgeGraphCanvas() {
  const router = useRouter();
  const { graph, isLoading, error } = useKnowledgeGraph();

  const nodes: Node<TopicNodeData>[] = useMemo(
    () =>
      (graph?.nodes ?? []).map((n) => ({
        id: n.id,
        type: "topic",
        position: n.position,
        data: {
          label: n.label,
          slug: n.slug,
          masteryScore: n.masteryScore,
          masteryLevel: n.masteryLevel,
          questionCount: n.questionCount,
        },
      })),
    [graph?.nodes]
  );

  const edges: Edge[] = useMemo(
    () =>
      (graph?.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.type === "related",
        style: {
          stroke: e.type === "related" ? "var(--color-primary)" : "var(--color-border)",
          strokeWidth: e.type === "related" ? 1.5 : 2,
          strokeDasharray: e.type === "related" ? "6 4" : undefined,
        },
      })),
    [graph?.edges]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const slug = (node.data as TopicNodeData).slug;
      if (slug) router.push(`/topics/${slug}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No topics available yet. Seed topics to see the knowledge graph.
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-12rem)] rounded-xl border border-border overflow-hidden bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const level = (n.data as TopicNodeData)?.masteryLevel ?? "none";
            if (level === "strong") return "#10b981";
            if (level === "building") return "#f59e0b";
            if (level === "weak") return "#f43f5e";
            return "#94a3b8";
          }}
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>

      <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-card/95 backdrop-blur px-4 py-3 text-xs space-y-2 shadow-sm">
        <p className="font-medium text-foreground">Mastery</p>
        <div className="space-y-1.5">
          {LEGEND.map(({ level, label, className }) => (
            <div key={level} className="flex items-center gap-2 text-muted-foreground">
              <span className={`w-3 h-3 rounded-sm border ${className}`} />
              {label}
            </div>
          ))}
        </div>
        <div className="pt-1 border-t border-border space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-6 border-t-2 border-border" />
            Hierarchy
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 border-t border-dashed border-primary" />
            Related topics
          </div>
        </div>
      </div>
    </div>
  );
}
