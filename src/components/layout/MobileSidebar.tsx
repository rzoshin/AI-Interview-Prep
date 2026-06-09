"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Brain, MessageSquare,
  TrendingUp, Map, Network, Settings, GraduationCap, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/stores/sidebar.store";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/questions", icon: BookOpen, label: "Questions" },
  { href: "/learn/study", icon: Brain, label: "Study Mode" },
  { href: "/learn/quiz", icon: GraduationCap, label: "Quiz Mode" },
  { href: "/learn/mock-interview", icon: MessageSquare, label: "Mock Interview" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/roadmap", icon: Map, label: "Roadmap" },
  { href: "/knowledge-graph", icon: Network, label: "Knowledge Graph" },
  { href: "/profile", icon: Settings, label: "Settings" },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="font-bold text-primary text-lg">InterviewPrep</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
