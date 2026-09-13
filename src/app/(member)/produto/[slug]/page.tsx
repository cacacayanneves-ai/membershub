import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getProductForUser } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { ProductCover } from "@/components/product-cover";
import { ContentUnlockedCard, ContentLockedCard } from "@/components/content-card";
import { LinkButton } from "@/components/ui/button";

export default async function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const user = await requireUser();
  const data = await getProductForUser(user.id, slug);
  if (!data) notFound();

  if (!data.owned) {
    const { product } = data;
    const benefitLines = (product.benefits ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const price = formatBRL(product.priceCents);

    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <ProductCover imageUrl={product.imageUrl} name={product.name} className="mb-8 h-56 w-full rounded-2xl" />

        <div className="mb-3 flex items-center gap-2">
          <Lock className="size-4 text-muted-dim" strokeWidth={2.25} />
          <span className="text-sm text-muted-dim">Você ainda não possui este produto</span>
        </div>

        <h1 className="mb-3 text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mb-6 leading-relaxed text-muted">{product.description}</p>

        {benefitLines.length > 0 && (
          <ul className="mb-8 space-y-2.5">
            {benefitLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-5">
          {product.checkoutUrl ? (
            <LinkButton href={product.checkoutUrl} size="lg" external>
              Comprar agora
            </LinkButton>
          ) : (
            <span className="text-sm text-muted-dim">Em breve disponível para compra.</span>
          )}
          {price && <span className="text-lg font-semibold">{price}</span>}
        </div>
      </div>
    );
  }

  const { product, contents } = data;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <ProductCover imageUrl={product.imageUrl} name={product.name} className="mb-6 h-48 w-full rounded-2xl" />
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-muted">{product.description}</p>
      </div>

      <div className="space-y-3">
        {contents.map((content) =>
          content.unlocked ? (
            <ContentUnlockedCard key={content.id} content={content} />
          ) : (
            <ContentLockedCard key={content.id} content={content} daysUntilUnlock={content.daysUntilUnlock} />
          )
        )}
      </div>
    </div>
  );
}
