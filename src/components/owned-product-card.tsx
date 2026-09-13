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
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong sm:flex-row"
    >
      <ProductCover imageUrl={product.imageUrl} name={product.name} className="h-40 w-full sm:h-auto sm:w-56 shrink-0" />
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
          <p className="mt-1.5 text-sm text-muted line-clamp-2">
            Seu pack está pronto para você. {unlockedCount} de {totalCount} conteúdos liberados.
          </p>
        </div>
        <div className="mt-4">
          <Button variant="secondary" size="sm" className="group-hover:border-accent/40">
            Acessar produto
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
