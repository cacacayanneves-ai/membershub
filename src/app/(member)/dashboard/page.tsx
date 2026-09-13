import { requireUser } from "@/lib/auth/guards";
import { getMyProducts, getOtherProducts } from "@/lib/queries";
import { OwnedProductCard } from "@/components/owned-product-card";
import { LockedProductCard } from "@/components/locked-product-card";
import { LockedBadge } from "@/components/ui/badge";
import { PackageOpen } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const [myProducts, otherProducts] = await Promise.all([
    getMyProducts(user.id),
    getOtherProducts(user.id),
  ]);

  const upcomingContents = myProducts
    .flatMap((mp) =>
      mp.contents
        .filter((c) => !c.unlocked)
        .map((c) => ({ content: c, productName: mp.product.name }))
    )
    .sort((a, b) => a.content.daysUntilUnlock - b.content.daysUntilUnlock)
    .slice(0, 4);

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]} 👋</h1>
        <p className="mt-1.5 text-sm text-muted">Bem-vindo à sua área exclusiva. Continue acessando seus produtos.</p>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-dim">Meus produtos</h2>
        {myProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <PackageOpen className="size-8 text-muted-dim" strokeWidth={1.5} />
            <p className="text-sm text-muted">
              Você ainda não tem produtos liberados. Assim que sua compra for aprovada, ela aparece aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myProducts.map((mp) => (
              <OwnedProductCard
                key={mp.product.id}
                product={mp.product}
                unlockedCount={mp.unlockedCount}
                totalCount={mp.contents.length}
              />
            ))}
          </div>
        )}
      </section>

      {upcomingContents.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-dim">Novos conteúdos</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingContents.map(({ content, productName }) => (
              <div
                key={content.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{content.name}</p>
                  <p className="text-xs text-muted-dim">{productName}</p>
                </div>
                <LockedBadge
                  label={content.daysUntilUnlock <= 1 ? "Libera amanhã" : `Libera em ${content.daysUntilUnlock} dias`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {otherProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-dim">Você também pode gostar</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherProducts.map((product) => (
              <LockedProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
