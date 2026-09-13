"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function DownloadButton({ href, label }: { href: string; label: string }) {
  const [clicked, setClicked] = useState(false);

  return (
    <a
      href={href}
      onClick={() => {
        setClicked(true);
        setTimeout(() => setClicked(false), 2500);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        clicked
          ? "border-success/30 bg-success/10 text-success"
          : "border-border-strong bg-surface text-foreground hover:bg-surface-hover"
      )}
    >
      {clicked ? <Check className="size-3.5" /> : <Download className="size-3.5" />}
      {clicked ? "Download iniciado" : label}
    </a>
  );
}
