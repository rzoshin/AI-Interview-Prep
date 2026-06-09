import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/shared/SessionProvider";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { UploadCloud, BookOpen, MessageSquare, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden md:flex w-56 flex-col bg-card border-r border-border shrink-0">
          <div className="flex items-center h-16 px-4 border-b border-border">
            <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {[
              { href: "/admin", icon: LayoutDashboard, label: "Overview" },
              { href: "/admin/pdf-upload", icon: UploadCloud, label: "PDF Upload" },
              { href: "/admin/questions", icon: BookOpen, label: "Questions" },
              { href: "/admin/prompts", icon: MessageSquare, label: "Prompts" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-2 border-t border-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              ← Back to App
            </Link>
          </div>
        </aside>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
