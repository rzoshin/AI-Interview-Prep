"use client";

import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "./UserAvatar";
import { useAvatarUpload } from "@/features/auth/hooks/useAvatarUpload";

interface AvatarUploadButtonProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClass = {
  sm: "h-8 w-8",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

export function AvatarUploadButton({
  src,
  name,
  size = "md",
  showLabel = false,
  className,
}: AvatarUploadButtonProps) {
  const { avatarUrl, isUploading, inputRef, openPicker, onFileChange } = useAvatarUpload(src);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={openPicker}
        disabled={isUploading}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Upload profile picture"
      >
        <UserAvatar
          src={avatarUrl ?? src}
          name={name}
          className={sizeClass[size]}
          fallbackClassName={size === "sm" ? "text-xs" : "text-lg"}
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
      {showLabel && (
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 2MB</p>
          <button
            type="button"
            onClick={openPicker}
            disabled={isUploading}
            className="text-xs text-primary hover:underline mt-1"
          >
            {isUploading ? "Uploading..." : "Change photo"}
          </button>
        </div>
      )}
    </div>
  );
}
