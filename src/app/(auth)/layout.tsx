import { SessionProvider } from "@/components/shared/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
