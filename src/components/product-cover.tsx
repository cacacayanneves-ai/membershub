import { cn } from "@/lib/utils";

export function ProductCover({
  imageUrl,
  name,
  className,
}: {
  imageUrl?: string | null;
  name: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-surface", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-accent/20 via-surface to-surface",
        className
      )}
    >
      <span className="text-3xl font-semibold text-accent/70">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
