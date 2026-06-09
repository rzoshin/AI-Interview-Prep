import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  TrendingUp,
  Zap,
  GraduationCap,
  MessageSquare,
  Map,
  ArrowRight,
} from "lucide-react";
import { progressService } from "@/services/progress.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const QUICK_ACTIONS = [
  {
    title: "Study a question",
    description: "Write your answer and get AI feedback",
    href: "/learn/study",
    icon: Brain,
    badge: "Active recall",
  },
  {
    title: "Take a quiz",
    description: "Timed MCQ practice by topic",
    href: "/learn/quiz",
    icon: GraduationCap,
    badge: "5 min",
  },
  {
    title: "Mock interview",
    description: "Practice with AI scoring",
    href: "/learn/mock-interview",
    icon: MessageSquare,
    badge: "Live",
  },
  {
    title: "View roadmap",
    description: "Your personalized learning path",
    href: "/roadmap",
    icon: Map,
    badge: "AI",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getStats(session.user.id);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="gradient-mesh p-6 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Ready to continue your interview preparation?"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Questions Completed"
          value={stats.questionsCompleted}
          icon={BookOpen}
          iconClassName="text-blue-500"
          iconBgClassName="bg-blue-500/10"
        />
        <StatCard
          label="Readiness Score"
          value={`${stats.readinessScore}%`}
          icon={TrendingUp}
          iconClassName="text-emerald-500"
          iconBgClassName="bg-emerald-500/10"
        />
        <StatCard
          label="Study Streak"
          value={`${stats.streakDays} days`}
          icon={Zap}
          iconClassName="text-amber-500"
          iconBgClassName="bg-amber-500/10"
        />
        <StatCard
          label="Topics Explored"
          value={stats.topicsExplored}
          icon={Brain}
          iconClassName="text-violet-500"
          iconBgClassName="bg-violet-500/10"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ title, description, href, icon: Icon, badge }) => (
            <Link key={href} href={href}>
              <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
                      <Badge variant="secondary" className="shrink-0">{badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                Start by exploring questions or studying with your own answers
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/questions">Browse questions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { title: "Explore JavaScript questions", href: "/questions", badge: "Start here" },
              { title: "Study mode with AI feedback", href: "/learn/study", badge: "New" },
              { title: "Check your progress", href: "/progress", badge: "Analytics" },
            ].map(({ title, href, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group"
              >
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {title}
                </span>
                <Badge variant="outline">{badge}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
