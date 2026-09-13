import Link from "next/link";
import { ProductCover } from "@/components/product-cover";
import { Lock } from "lucide-react";
import type { Product } from "@prisma/client";

export function LockedProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="relative aspect-[16/10] w-full">
        <ProductCover imageUrl={product.imageUrl} name={product.name} className="size-full grayscale-[40%]" />
        <div className="absolute inset-0 bg-background/50 transition-colors group-hover:bg-background/40" />
        <div className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full border border-border-strong bg-background/80 backdrop-blur-sm">
          <Lock className="size-3.5 text-muted" strokeWidth={2.25} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-dim">Você ainda não possui este produto.</p>
      </div>
    </Link>
  );
}
