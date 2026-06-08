"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, LogOut, User, Menu, Bell } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar.store";

export function Topbar() {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { setMobileOpen, isMobileOpen } = useSidebarStore();

  const themeIcons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const current = themes.indexOf((theme as "light" | "dark" | "system") ?? "system");
    setTheme(themes[(current + 1) % themes.length]);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <button
        onClick={() => setMobileOpen(!isMobileOpen)}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
        aria-label="Toggle mobile menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {themeIcons[theme as keyof typeof themeIcons] ?? themeIcons.system}
        </button>

        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
