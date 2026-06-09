"use client";

import { useRef, useState, useEffect, FC, ReactNode } from "react";
import Link from "next/link";
import {
  Brain, BookOpen, MessageSquare, TrendingUp, Map, Network,
  GraduationCap, Layers, Sparkles, ArrowRight, Github, Linkedin,
  Star, CheckCircle2, Zap, ChevronRight, LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  motion, useInView, useScroll, useTransform, useSpring,
  AnimatePresence, Variants, MotionValue,
} from "framer-motion";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface FeatureData {
  icon: LucideIcon;
  tag: string;
  title: string;
  headline: string;
  description: string;
  bullets: string[];
  color: string;
  accent: string;
  bg: string;
  visual: ReactNode;
}

interface ReviewData {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
}

interface StatData {
  value: string;
  label: string;
  numericValue: number;
  suffix: string;
}

type Direction = "up" | "down" | "left" | "right";

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 64 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: -64 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useScrollReveal(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin } as Parameters<typeof useInView>[1]);
  return { ref, inView };
}

function useCountUp(target: number, suffix: string, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { ref, display: count + suffix };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}

const Reveal: FC<RevealProps> = ({ children, delay = 0, direction = "up", className }) => {
  const { ref, inView } = useScrollReveal();
  const variantMap: Record<Direction, Variants> = {
    up: fadeUp, down: { hidden: { opacity: 0, y: -48 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } },
    left: fadeLeft, right: fadeRight,
  };
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}
      variants={variantMap[direction]} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
};

interface StaggerRevealProps { children: ReactNode; className?: string; delay?: number; }
const StaggerReveal: FC<StaggerRevealProps> = ({ children, className, delay = 0 }) => {
  const { ref, inView } = useScrollReveal();
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}
      variants={staggerContainer} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
};

const StaggerItem: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div variants={staggerItem} className={className}>{children}</motion.div>
);

// ─── DATA ────────────────────────────────────────────────────────────────────

const TICKER_ITEMS: string[] = [
  "🧠 AI-powered explanations", "⚡ 500+ curated questions", "🎯 Mock interviews with scoring",
  "📈 Real-time progress tracking", "🗺️ Personalized roadmaps", "🃏 Smart flashcard system",
  "🔗 Visual knowledge graph", "✍️ Write & get AI feedback", "🏆 Streak-based motivation",
  "📊 Weakness detection", "🤖 Layered AI explanations", "🚀 From beginner to senior-level",
];

const STATS: StatData[] = [
  { value: "500+", label: "Interview Questions", numericValue: 500, suffix: "+" },
  { value: "8", label: "Learning Modes", numericValue: 8, suffix: "" },
  { value: "10k+", label: "Developers Preparing", numericValue: 10, suffix: "k+" },
  { value: "94%", label: "Interview Success Rate", numericValue: 94, suffix: "%" },
];

const REVIEWS: ReviewData[] = [
  { name: "Aryan Mehta", role: "SDE @ Google", avatar: "AM", rating: 5, text: "The mock interview feature is genuinely scary-good. The AI asked me a follow-up I wasn't expecting and I realized I had a gap I didn't know about. Got the offer two weeks later." },
  { name: "Priya Nair", role: "Frontend Engineer @ Meta", avatar: "PN", rating: 5, text: "I've tried every prep platform out there. What's different here is writing my own answers and getting real feedback — not just reading model solutions and fooling myself I understand." },
  { name: "Daniel Park", role: "Backend Dev @ Stripe", avatar: "DP", rating: 5, text: "The knowledge graph alone is worth it. I could visually see that I was strong on trees but had completely ignored graph traversal. Fixed that in a week and aced the coding round." },
  { name: "Fatima Al-Hassan", role: "Full Stack @ Shopify", avatar: "FA", rating: 5, text: "I prepared for 3 weeks using the roadmap feature and it kept me honest. No random YouTube rabbit holes — just focused, targeted prep that got me to senior-level confidence fast." },
  { name: "Marcus Chen", role: "CS Student @ MIT", avatar: "MC", rating: 5, text: "The ELI5 to senior-level depth ladder for answers is brilliant. I start simple, understand the core, then ramp up. Never felt this prepared going into a technical screen before." },
  { name: "Riya Sharma", role: "Data Engineer @ Airbnb", avatar: "RS", rating: 5, text: "The streak system kept me going even on days I didn't feel like studying. That consistency is what actually makes a difference. Shipped 30 days straight and landed three offers." },
];

const FEATURE_LINKS = [
  { href: "/questions", label: "Questions" }, { href: "/learn/study", label: "Study Mode" },
  { href: "/learn/quiz", label: "Quiz Mode" }, { href: "/learn/flashcards", label: "Flashcards" },
  { href: "/learn/mock-interview", label: "Mock Interview" }, { href: "/progress", label: "Progress Tracking" },
  { href: "/roadmap", label: "Smart Roadmap" }, { href: "/knowledge-graph", label: "Knowledge Graph" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" }, { href: "/register", label: "Get started" },
  { href: "/dashboard", label: "Dashboard" }, { href: "/profile", label: "Settings" },
];

const SOCIAL_LINKS = [
  { href: "https://github.com/rzoshin", label: "GitHub", icon: Github },
  { href: "https://linkedin.com/in/raiyan-zannat", label: "LinkedIn", icon: Linkedin },
];

// ─── FEATURE VISUALS ─────────────────────────────────────────────────────────

function QuestionExplorerVisual() {
  const questions = [
    { tag: "Arrays", diff: "Easy", title: "Two Sum", color: "text-green-400 bg-green-400/10" },
    { tag: "DP", diff: "Hard", title: "Longest Palindromic Substring", color: "text-red-400 bg-red-400/10" },
    { tag: "Trees", diff: "Medium", title: "Binary Tree Level Order", color: "text-amber-400 bg-amber-400/10" },
    { tag: "Graphs", diff: "Medium", title: "Number of Islands", color: "text-amber-400 bg-amber-400/10" },
  ];
  return (
    <div className="space-y-3 w-full">
      <div className="flex gap-2 flex-wrap mb-4">
        {["All", "Arrays", "DP", "Trees", "Graphs"].map((t, i) => (
          <span key={t} className={`px-3 py-1 rounded-full text-xs font-medium border ${i === 0 ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{t}</span>
        ))}
      </div>
      {questions.map((q, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group">
          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${q.color}`}>{q.diff}</span>
          <span className="text-sm font-medium flex-1">{q.title}</span>
          <span className="text-xs text-muted-foreground">{q.tag}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
      ))}
    </div>
  );
}

function AIEngineVisual() {
  const [level, setLevel] = useState(1);
  const levels = ["ELI5", "Beginner", "Mid", "Senior", "Expert"];
  const texts = [
    "Think of a hash table like a magical filing cabinet — you tell it where to put things, and it remembers exactly where they are!",
    "A hash table stores key-value pairs. A hash function converts keys into array indices for O(1) average lookup time.",
    "Hash tables use open addressing or chaining to handle collisions. Load factor affects performance — rehashing occurs when it exceeds a threshold.",
    "At high load factors, consider Robin Hood hashing to minimize variance. Consistent hashing is preferred in distributed systems for minimal key remapping.",
    "Cuckoo hashing guarantees O(1) worst-case lookup. Extendible hashing allows dynamic resizing without full rehash. Consider cache locality with open addressing.",
  ];
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Depth:</span>
        <div className="flex gap-1">
          {levels.map((l, i) => (
            <button key={l} onClick={() => setLevel(i)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${level === i ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card/60 p-4 min-h-[110px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs font-semibold text-violet-500">Hash Tables — {levels[level]}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={level} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            className="text-sm text-muted-foreground leading-relaxed">{texts[level]}</motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StudyModeVisual() {
  return (
    <div className="w-full space-y-3">
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} viewport={{ once: true }}
        className="rounded-xl border border-border bg-card/60 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Question</p>
        <p className="text-sm font-medium">Explain the difference between <code className="bg-muted px-1 rounded text-xs">{"`==`"}</code> and <code className="bg-muted px-1 rounded text-xs">{"`===`"}</code> in JavaScript.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} viewport={{ once: true }}
        className="rounded-xl border border-primary/30 bg-card/60 p-4">
        <p className="text-xs font-semibold text-primary mb-2">Your Answer</p>
        <p className="text-sm text-muted-foreground">== checks value equality with type coercion, while === checks both value and type strictly without coercion...</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} viewport={{ once: true }}
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-500">AI Feedback</span>
          <span className="ml-auto text-xs font-bold text-emerald-500">8.5 / 10</span>
        </div>
        <p className="text-xs text-muted-foreground">✅ Correct on type coercion. ✅ Strict equality covered. ⚠️ Missing: mention NaN === NaN returning false.</p>
      </motion.div>
    </div>
  );
}

function FlashcardVisual() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="relative w-full h-44 cursor-pointer select-none" style={{ perspective: 1200 }} onClick={() => setFlipped(f => !f)}>
        <motion.div className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.55, type: "spring", stiffness: 260, damping: 28 }}>
          <div className="absolute inset-0 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 flex flex-col justify-between" style={{ backfaceVisibility: "hidden" }}>
            <span className="text-xs font-semibold text-amber-500 tracking-wider">CONCEPT</span>
            <p className="text-base font-semibold text-center">What is Big O notation?</p>
            <span className="text-xs text-muted-foreground text-center">Tap to reveal answer →</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 flex flex-col justify-between" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <span className="text-xs font-semibold text-emerald-500 tracking-wider">ANSWER</span>
            <p className="text-sm text-center leading-relaxed">A mathematical notation describing algorithm complexity — how runtime or space scales with input size in the worst case.</p>
            <span className="text-xs text-muted-foreground text-center">← Tap to flip back</span>
          </div>
        </motion.div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Review again</button>
        <button className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Got it ✓</button>
      </div>
    </div>
  );
}

function MockInterviewVisual() {
  const messages = [
    { role: "ai", text: "Tell me about a time you had to optimize a slow database query." },
    { role: "user", text: "I identified a missing index on a foreign key column causing full table scans..." },
    { role: "ai", text: "Good. What was the impact on query time and how did you measure it?" },
  ];
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs font-semibold text-rose-500">Mock Interview — Senior Backend</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">14:32</span>
      </div>
      {messages.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.18 }} viewport={{ once: true }}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${m.role === "ai" ? "bg-muted text-foreground rounded-tl-sm" : "bg-rose-500/15 text-foreground rounded-tr-sm border border-rose-500/20"}`}>
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProgressVisual() {
  const bars = [
    { label: "Arrays & Strings", pct: 82, color: "bg-cyan-500" },
    { label: "Dynamic Programming", pct: 47, color: "bg-amber-500" },
    { label: "Trees & Graphs", pct: 71, color: "bg-emerald-500" },
    { label: "System Design", pct: 35, color: "bg-rose-500" },
  ];
  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-3 gap-3 mb-2">
        {([["🔥", "12", "day streak"], ["⭐", "94%", "readiness"], ["✅", "148", "mastered"]] as [string, string, string][]).map(([emoji, val, lbl], i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            className="rounded-xl border border-border bg-card/60 p-3 text-center">
            <div className="text-lg">{emoji}</div>
            <div className="text-lg font-bold">{val}</div>
            <div className="text-xs text-muted-foreground">{lbl}</div>
          </motion.div>
        ))}
      </div>
      {bars.map((b, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-semibold">{b.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div className={`h-full rounded-full ${b.color}`}
              initial={{ width: 0 }} whileInView={{ width: `${b.pct}%` }}
              transition={{ duration: 1.1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoadmapVisual() {
  const steps = [
    { week: "Week 1", topic: "Arrays, Strings & Hashing", done: true },
    { week: "Week 2", topic: "Two Pointers & Sliding Window", done: true },
    { week: "Week 3", topic: "Trees & Binary Search", active: true, done: false },
    { week: "Week 4", topic: "Graphs & BFS/DFS", done: false },
    { week: "Week 5", topic: "Dynamic Programming", done: false },
  ];
  return (
    <div className="w-full space-y-2">
      {steps.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${s.active ? "border-indigo-500/50 bg-indigo-500/10" : s.done ? "border-border bg-card/40 opacity-70" : "border-border bg-card/20 opacity-45"}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.done ? "bg-emerald-500/20 text-emerald-500" : s.active ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"}`}>
            {s.done ? "✓" : s.active ? "→" : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{s.week}</div>
            <div className="text-sm font-medium truncate">{s.topic}</div>
          </div>
          {s.active && <span className="text-xs font-semibold text-indigo-400 flex-shrink-0">In progress</span>}
        </motion.div>
      ))}
    </div>
  );
}

function KnowledgeGraphVisual() {
  const nodes = [
    { x: 50, y: 50, label: "Arrays", color: "#22c55e" },
    { x: 80, y: 28, label: "Strings", color: "#22c55e" },
    { x: 18, y: 72, label: "Graphs", color: "#f59e0b" },
    { x: 72, y: 75, label: "Trees", color: "#f59e0b" },
    { x: 50, y: 18, label: "Hashing", color: "#22c55e" },
    { x: 28, y: 42, label: "DP", color: "#ef4444" },
  ];
  const edges: [number, number][] = [[0, 1], [0, 3], [0, 4], [1, 4], [2, 3], [5, 0], [5, 2]];
  return (
    <div className="w-full rounded-xl border border-border bg-card/40 overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: 200 }}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={`${nodes[a].x}%`} y1={`${nodes[a].y}%`} x2={`${nodes[b].x}%`} y2={`${nodes[b].y}%`}
            stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.8" className="text-foreground" />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <motion.circle cx={`${n.x}%`} cy={`${n.y}%`} r="6"
              fill={n.color} fillOpacity="0.18" stroke={n.color} strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }} viewport={{ once: true }} />
            <text x={`${n.x}%`} y={`${n.y + 11}%`} textAnchor="middle" fontSize="3.8" fill="currentColor" fillOpacity="0.65" className="text-foreground">{n.label}</text>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
        {([["#22c55e", "Mastered"], ["#f59e0b", "Learning"], ["#ef4444", "Weak"]] as [string, string][]).map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            <span className="text-xs text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURES ARRAY (after visual components are declared) ────────────────────

const FEATURES: FeatureData[] = [
  {
    icon: BookOpen, tag: "Explore", title: "Question Explorer",
    headline: "500+ questions, perfectly organized",
    description: "Browse a curated library of technical interview questions filtered by topic, difficulty, and tags. Whether you're targeting DSA, system design, or behavioral rounds — find exactly what you need in seconds.",
    bullets: ["Filter by topic, difficulty & tags", "Community-rated quality scores", "Bookmark for later review"],
    color: "from-blue-500/20 to-indigo-500/10", accent: "text-blue-500", bg: "bg-blue-500/10",
    visual: <QuestionExplorerVisual />,
  },
  {
    icon: Sparkles, tag: "AI Engine", title: "AI Answer Engine",
    headline: "Understand answers at your level",
    description: "Not just model answers — layered explanations you can dial up from ELI5 to senior engineer depth. Every answer includes code examples, edge cases, and a quick knowledge check.",
    bullets: ["ELI5 → Senior-level depth ladder", "Syntax-highlighted code samples", "Built-in knowledge quizzes"],
    color: "from-violet-500/20 to-purple-500/10", accent: "text-violet-500", bg: "bg-violet-500/10",
    visual: <AIEngineVisual />,
  },
  {
    icon: GraduationCap, tag: "Learn", title: "Study & Quiz Modes",
    headline: "Write answers, get honest AI feedback",
    description: "Stop passive reading. Type your own answer, submit it, and get line-by-line AI feedback on what you got right, what you missed, and how to improve. Follow up with timed quizzes to cement retention.",
    bullets: ["Active recall over passive reading", "AI line-by-line scoring", "Timed quiz pressure simulation"],
    color: "from-emerald-500/20 to-teal-500/10", accent: "text-emerald-500", bg: "bg-emerald-500/10",
    visual: <StudyModeVisual />,
  },
  {
    icon: Layers, tag: "Revise", title: "Flashcards",
    headline: "Active recall, beautifully simple",
    description: "Flip through smart flashcards designed for spaced repetition. Mark cards as known or needs-review and let the system resurface the ones you need most — right before they slip from memory.",
    bullets: ["Spaced repetition algorithm", "Tap-to-flip animations", "Auto-prioritizes weak cards"],
    color: "from-amber-500/20 to-orange-500/10", accent: "text-amber-500", bg: "bg-amber-500/10",
    visual: <FlashcardVisual />,
  },
  {
    icon: MessageSquare, tag: "Practice", title: "Mock Interview",
    headline: "Practice the real thing, safely",
    description: "Simulate live interviews with an AI interviewer who asks follow-ups, challenges your answers, and scores your performance. Build confidence before the real conversation.",
    bullets: ["Dynamic follow-up questions", "Time-boxed responses", "Detailed post-interview report"],
    color: "from-rose-500/20 to-pink-500/10", accent: "text-rose-500", bg: "bg-rose-500/10",
    visual: <MockInterviewVisual />,
  },
  {
    icon: TrendingUp, tag: "Track", title: "Progress Tracking",
    headline: "Know exactly where you stand",
    description: "A live dashboard shows your readiness score, mastery by topic, streak history, and your weakest areas — so every study session is targeted, not random.",
    bullets: ["Per-topic mastery breakdown", "Daily streak & momentum", "Weak area prioritization"],
    color: "from-cyan-500/20 to-sky-500/10", accent: "text-cyan-500", bg: "bg-cyan-500/10",
    visual: <ProgressVisual />,
  },
  {
    icon: Map, tag: "Plan", title: "Smart Roadmap",
    headline: "Your personalized interview plan",
    description: "Skip the overwhelm. Your roadmap adapts to your role, timeline, and performance — surfacing the next best thing to study so you make the most of every hour.",
    bullets: ["Role & timeline aware", "Adapts based on quiz results", "Week-by-week milestones"],
    color: "from-indigo-500/20 to-blue-500/10", accent: "text-indigo-500", bg: "bg-indigo-500/10",
    visual: <RoadmapVisual />,
  },
  {
    icon: Network, tag: "Visualize", title: "Knowledge Graph",
    headline: "See how everything connects",
    description: "A visual map of every topic and its relationships — colored by your mastery level. Spot the gaps you didn't know you had and follow the links to fill them.",
    bullets: ["Node graph with mastery color coding", "Click to drill into any topic", "Shows concept dependencies"],
    color: "from-fuchsia-500/20 to-purple-500/10", accent: "text-fuchsia-500", bg: "bg-fuchsia-500/10",
    visual: <KnowledgeGraphVisual />,
  },
];

// ─── TICKER ──────────────────────────────────────────────────────────────────

function Ticker() {
  const [paused, setPaused] = useState(false);
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-border bg-muted/30 py-3.5 cursor-default"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <motion.div className="flex gap-12 whitespace-nowrap will-change-transform"
        animate={paused ? { x: undefined } : { x: ["0%", "-50%"] }}
        transition={paused ? {} : { duration: 35, repeat: Infinity, ease: "linear", repeatType: "loop" }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            {item}
            <span className="text-primary/30 text-lg leading-none">·</span>
          </span>
        ))}
      </motion.div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}

// ─── STATS BAR ───────────────────────────────────────────────────────────────

function StatCounter({ numericValue, suffix, label }: StatData) {
  const { ref, display } = useCountUp(numericValue, suffix);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black tracking-tight text-foreground tabular-nums">{display}</div>
      <div className="mt-1.5 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatsBar() {
  return (
    <section className="border-b border-border bg-muted/20 px-6 py-12">
      <StaggerReveal className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {STATS.map((s, i) => (
          <StaggerItem key={i}>
            <StatCounter {...s} />
          </StaggerItem>
        ))}
      </StaggerReveal>
    </section>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────

function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={containerRef} className="relative overflow-hidden px-6 py-28 sm:py-40">
      {/* Parallax gradient blobs */}
      <motion.div style={{ y }} className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/7 blur-[80px]" />
      <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, 60]) }} className="pointer-events-none absolute top-1/2 left-[15%] h-80 w-80 rounded-full bg-violet-500/7 blur-[60px]" />
      <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, 80]) }} className="pointer-events-none absolute top-1/3 right-[12%] h-56 w-56 rounded-full bg-blue-500/7 blur-[50px]" />

      <motion.div style={{ opacity }} className="mx-auto max-w-4xl text-center relative z-10">
        <Reveal delay={0}>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-powered interview preparation
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl leading-[1.04]">
            Master your next
            <span className="block bg-gradient-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent mt-1">
              technical interview
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Practice with AI feedback, run mock interviews, visualize your knowledge graph,
            and track real readiness — all in one focused platform built for developers.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-xl shadow-primary/25" asChild>
              <Link href="/register">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12" asChild>
              <Link href="/questions">
                Browse questions <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free to start</p>
        </Reveal>

        {/* Floating badge hints */}
        <Reveal delay={0.36}>
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {["Mock Interviews", "AI Feedback", "Knowledge Graph", "Progress Tracking", "Flashcards"].map((tag) => (
              <motion.span key={tag} whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 400 }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-border bg-card/60 text-muted-foreground backdrop-blur-sm cursor-default">
                {tag}
              </motion.span>
            ))}
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
}

// ─── ZIGZAG FEATURE SECTIONS ─────────────────────────────────────────────────

interface FeatureSectionProps { feature: FeatureData; index: number; }

function FeatureSection({ feature, index }: FeatureSectionProps) {
  const isEven = index % 2 === 0;
  const { icon: Icon, tag, title, headline, description, bullets, color, accent, bg, visual } = feature;
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const visualScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.96]);

  return (
    <section ref={sectionRef} className={`px-6 py-24 border-t border-border overflow-hidden ${index % 2 !== 0 ? "bg-muted/20" : ""}`}>
      <div className="mx-auto max-w-6xl">
        <div className={`grid gap-12 lg:grid-cols-2 lg:gap-24 items-center ${!isEven ? "lg:[&>*:first-child]:order-2" : ""}`}>

          {/* ── Text side ── */}
          <Reveal direction={isEven ? "right" : "left"}>
            <div>
              <motion.div whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${accent} mb-5`}>
                  <Icon className="h-3.5 w-3.5" />
                  {tag}
                </span>
              </motion.div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl mb-4 leading-tight">{headline}</h2>
              <p className="text-muted-foreground leading-relaxed mb-7 text-[15px]">{description}</p>

              <StaggerReveal className="space-y-3 mb-9">
                {bullets.map((b, i) => (
                  <StaggerItem key={i}>
                    <div className="flex items-center gap-3 text-sm">
                      <motion.div whileInView={{ scale: [0, 1.3, 1] }} transition={{ delay: i * 0.08, duration: 0.4 }} viewport={{ once: true }}>
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${accent}`} />
                      </motion.div>
                      {b}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>

              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button variant="outline" className="gap-2 group" asChild>
                  <Link href="/register">
                    Try {title}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </Reveal>

          {/* ── Visual side with parallax ── */}
          <Reveal direction={isEven ? "left" : "right"} delay={0.1}>
            <motion.div style={{ y: visualY, scale: visualScale }}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${color} p-6 sm:p-8 shadow-lg`}>
              {visual}
            </motion.div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

// ─── FEATURE DIVIDER STRIP ───────────────────────────────────────────────────

function FeatureDivider() {
  return (
    <section className="px-6 py-16 border-t border-border bg-gradient-to-r from-primary/3 via-violet-500/3 to-blue-500/3">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Everything in one place</p>
            <h2 className="mt-2 text-2xl font-black">8 tools. One goal: getting hired.</h2>
          </div>
        </Reveal>
        <StaggerReveal className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card/50 text-center cursor-default hover:border-primary/30 hover:shadow-md transition-shadow">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${f.bg}`}>
                    <Icon className={`h-5 w-5 ${f.accent}`} />
                  </div>
                  <span className="text-sm font-semibold">{f.title}</span>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}

// ─── MID-PAGE CTA ─────────────────────────────────────────────────────────────

function MidCTA() {
  return (
    <section className="px-6 py-20 border-t border-border">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/25 bg-primary/5 p-10 sm:p-14 text-center relative overflow-hidden">
          <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/8"
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          <div className="relative z-10">
            <motion.div whileInView={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Zap className="h-7 w-7 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Stop reading. Start practicing.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Most developers read solutions without truly understanding them. InterviewPrep forces you to write, explain, and prove your understanding.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                <Link href="/register">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/learn/mock-interview">Try a mock interview</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

function Reviews() {
  return (
    <section className="px-6 py-24 border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Testimonials</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Developers who landed the job</h2>
            <p className="mt-3 text-muted-foreground">Real feedback from real engineers</p>
          </div>
        </Reveal>
        <StaggerReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <StaggerItem key={i}>
              <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 350 }} className="h-full">
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/20">
                  <CardContent className="p-6 flex flex-col gap-4 h-full">
                    <div className="flex gap-1">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{r.text}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{r.avatar}</div>
                      <div>
                        <div className="text-sm font-semibold">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

// ─── FINAL CTA ───────────────────────────────────────────────────────────────

function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={ref} className="border-t border-border px-6 py-28 sm:py-36">
      <motion.div style={{ scale, opacity }} className="mx-auto max-w-3xl text-center relative">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[500px] rounded-full bg-primary/8 blur-[70px]" />
        <div className="relative z-10">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Join 10,000+ developers
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl leading-tight">
              Your next offer starts
              <span className="block bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent mt-1">
                with one question
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Build interview confidence systematically. Start with one question today — your roadmap, your flashcards, and your AI coach are waiting.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-base h-12 px-9 shadow-2xl shadow-primary/25" asChild>
                <Link href="/register">Create free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-9" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Free forever · No credit card · Start in 30 seconds</p>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 px-6 py-14">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">InterviewPrep</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            AI-powered technical interview preparation with questions, quizzes, mock interviews, roadmaps, and progress tracking.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Features</h3>
          <nav className="mt-4 grid gap-2 text-sm text-muted-foreground">
            {FEATURE_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-foreground">{label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <h3 className="font-semibold">Account</h3>
          <nav className="mt-4 grid gap-2 text-sm text-muted-foreground">
            {ACCOUNT_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-foreground">{label}</Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} InterviewPrep. All rights reserved.</p>
        <p>Built for developers preparing for technical interviews.</p>
      </div>
    </footer>
  );
}

// ─── ROOT EXPORT ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">InterviewPrep</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/register">Get started</Link></Button>
          </nav>
        </div>
      </motion.header>

      <Hero />
      <Ticker />
      <StatsBar />
      <FeatureDivider />

      {FEATURES.map((feature, i) => (
        <FeatureSection key={feature.title} feature={feature} index={i} />
      ))}

      <MidCTA />
      <Reviews />
      <FinalCTA />
      <Footer />
    </div>
  );
}
