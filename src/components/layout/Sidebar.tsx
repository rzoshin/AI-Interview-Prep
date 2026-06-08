"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  MessageSquare,
  TrendingUp,
  Map,
  Network,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/stores/sidebar.store";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/questions", icon: BookOpen, label: "Questions" },
  { href: "/learn/study", icon: Brain, label: "Study Mode" },
  { href: "/learn/quiz", icon: GraduationCap, label: "Quiz Mode" },
  { href: "/learn/flashcards", icon: Layers, label: "Flashcards" },
  { href: "/learn/mock-interview", icon: MessageSquare, label: "Mock Interview" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/roadmap", icon: Map, label: "Roadmap" },
  { href: "/knowledge-graph", icon: Network, label: "Knowledge Graph" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative hidden md:flex flex-col h-full bg-card border-r border-border shrink-0 overflow-hidden"
    >
      <div className="flex items-center h-16 px-4 border-b border-border">
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-primary text-lg truncate"
            >
              InterviewPrep
            </motion.span>
          )}
        </AnimatePresence>
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              pathname.startsWith("/admin") && "bg-primary/10 text-primary"
            )}
          >
            <Shield className="w-5 h-5 shrink-0" />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate overflow-hidden"
                >
                  Admin Panel
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            pathname === "/profile" && "bg-primary/10 text-primary"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate overflow-hidden"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <button
        onClick={toggle}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
