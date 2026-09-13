import { cn } from "@/lib/utils";
import { Lock, CheckCircle2 } from "lucide-react";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-white/5 text-muted border-border-strong",
    accent: "bg-accent/10 text-accent border-accent/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-danger/10 text-danger border-danger/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function LockedBadge({ label }: { label: string }) {
  return (
    <Badge tone="neutral">
      <Lock className="size-3" strokeWidth={2.25} />
      {label}
    </Badge>
  );
}

export function UnlockedBadge({ label = "Liberado" }: { label?: string }) {
  return (
    <Badge tone="success">
      <CheckCircle2 className="size-3" strokeWidth={2.25} />
      {label}
    </Badge>
  );
}
