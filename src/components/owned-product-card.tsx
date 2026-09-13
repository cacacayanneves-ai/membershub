import Link from "next/link";
import { ProductCover } from "@/components/product-cover";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Product } from "@prisma/client";

export function OwnedProductCard({
  product,
  unlockedCount,
  totalCount,
}: {
  product: Product;
  unlockedCount: number;
  totalCount: number;
}) {
  const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 100;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <ProductCover imageUrl={product.imageUrl} name={product.name} className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
          <p className="mt-1 text-sm text-muted">Seu pack está pronto para você.</p>
        </div>

        <div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-dim">
            {unlockedCount} de {totalCount} conteúdos liberados
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="mt-auto w-fit group-hover:border-accent/40"
        >
          Acessar produto
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </Link>
  );
}
