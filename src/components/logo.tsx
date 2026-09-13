import { cn } from "@/lib/utils";

/** Marca provisória do Members Hub — um ícone de "hub" (nó central + satélites). */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[56%] w-[56%]" fill="none">
        <path
          d="M12 6.3V9.7M13.5 13.1L17 14.7M10.5 13.1L7 14.7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2.3" fill="currentColor" />
        <circle cx="12" cy="4.4" r="1.7" fill="currentColor" />
        <circle cx="18.6" cy="15.6" r="1.7" fill="currentColor" />
        <circle cx="5.4" cy="15.6" r="1.7" fill="currentColor" />
      </svg>
    </div>
  );
}
