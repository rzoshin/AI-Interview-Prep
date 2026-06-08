import { put, del } from "@vercel/blob";

export async function uploadBlob(
  file: File | Blob,
  folder: string,
  filename?: string
): Promise<{ url: string; pathname: string }> {
  const name = filename ?? (file instanceof File ? file.name : `upload-${Date.now()}`);
  const blob = await put(`${folder}/${Date.now()}-${name}`, file, {
    access: "public",
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}
