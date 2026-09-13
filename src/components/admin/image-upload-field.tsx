"use client";

import { useState } from "react";
import { Label } from "@/components/ui/input";
import { ImagePlus } from "lucide-react";

export function ImageUploadField({
  label,
  currentImageUrl,
}: {
  label: string;
  currentImageUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);

  return (
    <div>
      <Label>{label}</Label>
      <input type="hidden" name="currentImageUrl" value={currentImageUrl ?? ""} />
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-strong bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Prévia da capa" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-dim" strokeWidth={1.5} />
          )}
        </div>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
      </div>
    </div>
  );
}
