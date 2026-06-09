import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Brain, TrendingUp, Zap } from "lucide-react";
import { progressService } from "@/services/progress.service";

async function getStats(userId: string) {
  try {
    const progress = await progressService.getProgress(userId);
    return {
      questionsCompleted: progress?.completedQuestions?.length ?? 0,
      readinessScore: progress?.readinessScore ?? 0,
      streakDays: progressService.getStreakDays(progress),
      topicsExplored: progress?.topicMastery?.length ?? 0,
    };
  } catch {
    return { questionsCompleted: 0, readinessScore: 0, streakDays: 0, topicsExplored: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const stats = await getStats(session.user.id);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const statCards = [
    {
      label: "Questions Completed",
      value: stats.questionsCompleted,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Readiness Score",
      value: `${stats.readinessScore}%`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Study Streak",
      value: `${stats.streakDays} days`,
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Topics Explored",
      value: stats.topicsExplored,
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to continue your interview preparation?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start by exploring questions
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Recommended Next Steps</h2>
          <div className="space-y-3">
            {[
              { title: "Explore JavaScript questions", href: "/questions?topic=javascript", badge: "Start here" },
              { title: "Take a quick quiz", href: "/learn/quiz", badge: "5 min" },
              { title: "View your roadmap", href: "/roadmap", badge: "Personalized" },
            ].map(({ title, href, badge }) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {title}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {badge}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
