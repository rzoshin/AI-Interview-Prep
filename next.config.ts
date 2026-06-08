import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler is expensive in dev (runs Babel over every file on top of
  // Turbopack). Keep it for production builds only, so local dev stays fast.
  reactCompiler: process.env.NODE_ENV === "production",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
