"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

function initials(name?: string | null): string {
  if (!name?.trim()) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ src, name, className, fallbackClassName }: UserAvatarProps) {
  const label = initials(name);
  const hasImage = typeof src === "string" && src.length > 0;

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {hasImage && (
        <AvatarImage src={src} alt={name ?? "User avatar"} referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className={cn("text-xs", fallbackClassName)} delayMs={hasImage ? 600 : 0}>
        {label || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
