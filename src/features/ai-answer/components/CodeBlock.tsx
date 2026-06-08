"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
}

// Strips a leading/trailing markdown fence (```lang ... ```) if present.
function stripFence(raw: string): { language: string; body: string } {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```([\w+-]*)\n([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    return { language: fenceMatch[1] || "code", body: fenceMatch[2] };
  }
  return { language: "code", body: trimmed };
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { language, body } = stripFence(code);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore
    }
  }

  return (
    <div className="relative rounded-lg border border-border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/80">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm scrollbar-thin">
        <code className="font-mono text-foreground whitespace-pre">{body}</code>
      </pre>
    </div>
  );
}
