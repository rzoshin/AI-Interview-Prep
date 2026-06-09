"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { IUser } from "@/types";
import { AvatarUploadButton } from "@/components/shared/AvatarUploadButton";

interface ProfileFormProps {
  user: IUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferences: {
            theme: (theme as "light" | "dark" | "system") ?? "system",
          },
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 p-6 rounded-xl border border-border bg-card">
        <AvatarUploadButton
          src={user.avatar}
          name={user.name}
          size="lg"
          showLabel
        />
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Role: {user.role}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <h3 className="font-semibold">Account Information</h3>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Display Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            value={user.email}
            disabled
            className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <h3 className="font-semibold">Preferences</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Theme</label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </form>
  );
}
