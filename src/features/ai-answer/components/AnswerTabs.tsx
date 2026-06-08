"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { AlertTriangle, HelpCircle, Link2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CodeBlock } from "./CodeBlock";
import type { IAIAnswer } from "@/types/index";

interface AnswerTabsProps {
  answer: IAIAnswer;
}

const TAB_ITEMS = [
  { value: "eli5", label: "ELI5" },
  { value: "beginner", label: "Beginner" },
  { value: "interview", label: "Interview" },
  { value: "senior", label: "Senior" },
  { value: "code", label: "Code" },
] as const;

function ProseText({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-sm text-muted-foreground italic">No content generated.</p>;
  }
  return (
    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{text}</p>
  );
}

export function AnswerTabs({ answer }: AnswerTabsProps) {
  const [lang, setLang] = useState<"bangla" | "english">("english");

  return (
    <div className="flex flex-col gap-6">
      <Tabs.Root defaultValue="eli5" className="flex flex-col gap-4">
        <Tabs.List className="flex flex-wrap gap-1 border-b border-border">
          {TAB_ITEMS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "px-3 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent -mb-px transition-colors",
                "hover:text-foreground",
                "data-[state=active]:text-primary data-[state=active]:border-primary"
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="eli5" className="focus:outline-none">
          <div className="flex items-center gap-1 mb-3">
            {(["english", "bangla"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                  lang === l
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l === "english" ? "English" : "বাংলা"}
              </button>
            ))}
          </div>
          <ProseText text={lang === "english" ? answer.english_eli5 : answer.bangla_eli5} />
        </Tabs.Content>

        <Tabs.Content value="beginner" className="focus:outline-none">
          <ProseText text={answer.beginner_answer} />
        </Tabs.Content>

        <Tabs.Content value="interview" className="focus:outline-none">
          <ProseText text={answer.interview_answer} />
        </Tabs.Content>

        <Tabs.Content value="senior" className="focus:outline-none">
          <ProseText text={answer.senior_answer} />
        </Tabs.Content>

        <Tabs.Content value="code" className="focus:outline-none">
          {answer.code_example.trim() ? (
            <CodeBlock code={answer.code_example} />
          ) : (
            <p className="text-sm text-muted-foreground italic">No code example for this question.</p>
          )}
        </Tabs.Content>
      </Tabs.Root>

      {answer.common_mistakes.length > 0 && (
        <Section icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} title="Common Mistakes">
          <ul className="list-disc pl-5 space-y-1">
            {answer.common_mistakes.map((m, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed">{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {answer.follow_up_questions.length > 0 && (
        <Section icon={<HelpCircle className="w-4 h-4 text-sky-500" />} title="Follow-up Questions">
          <ul className="list-disc pl-5 space-y-1">
            {answer.follow_up_questions.map((q, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed">{q}</li>
            ))}
          </ul>
        </Section>
      )}

      {answer.related_topics.length > 0 && (
        <Section icon={<Link2 className="w-4 h-4 text-violet-500" />} title="Related Topics">
          <div className="flex flex-wrap gap-1.5">
            {answer.related_topics.map((t, i) => (
              <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {answer.quiz_questions.length > 0 && (
        <Section icon={<ListChecks className="w-4 h-4 text-emerald-500" />} title="Quiz Preview">
          <div className="flex flex-col gap-4">
            {answer.quiz_questions.map((quiz, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  {i + 1}. {quiz.question}
                </p>
                <ul className="space-y-1">
                  {quiz.options.map((opt, j) => (
                    <li
                      key={j}
                      className={cn(
                        "text-sm px-2 py-1 rounded-md",
                        j === quiz.correctIndex
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + j)}. {opt}
                    </li>
                  ))}
                </ul>
                {quiz.explanation && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {quiz.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
