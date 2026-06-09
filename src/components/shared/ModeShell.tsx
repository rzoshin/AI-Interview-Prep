import { cn } from "@/lib/utils/cn";
import { PageHeader } from "./PageHeader";

interface ModeShellProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "7xl";
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
};

export function ModeShell({
  icon,
  title,
  description,
  children,
  className,
  maxWidth = "4xl",
}: ModeShellProps) {
  return (
    <div className={cn("mx-auto w-full space-y-6 p-6", maxWidthClass[maxWidth], className)}>
      <PageHeader icon={icon} title={title} description={description} />
      {children}
    </div>
  );
}
