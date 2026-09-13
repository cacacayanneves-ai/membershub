"use client";

import { cn } from "@/lib/utils";

export function ConfirmSubmitButton({
  children,
  confirmText,
  className,
  variant = "ghost",
}: {
  children: React.ReactNode;
  confirmText: string;
  className?: string;
  variant?: "ghost" | "danger";
}) {
  const variantClasses =
    variant === "danger"
      ? "text-danger hover:bg-danger/10"
      : "text-muted hover:text-foreground hover:bg-surface-hover";

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={cn("rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors", variantClasses, className)}
    >
      {children}
    </button>
  );
}
