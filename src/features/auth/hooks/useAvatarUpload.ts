"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function useAvatarUpload(initialUrl?: string | null) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Upload failed");
      }

      const url = json.data.avatar as string;
      setAvatarUrl(url);
      await update({ image: url });
      toast.success("Profile picture updated");
      return url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await upload(file);
    e.target.value = "";
  }

  return {
    avatarUrl,
    isUploading,
    inputRef,
    openPicker,
    onFileChange,
    upload,
  };
}
