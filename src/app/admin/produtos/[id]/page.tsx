import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ProductForm } from "../ProductForm";
import { updateProductAction } from "../actions";
import { ContentEditor } from "./ContentEditor";
import { NewContentForm } from "./NewContentForm";

export default async function EditProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { contents: { orderBy: { order: "asc" }, include: { files: { orderBy: { order: "asc" } } } } },
  });
  if (!product) notFound();

  const boundUpdate = updateProductAction.bind(null, product.id);

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-10">
      <Link href="/admin/produtos" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Voltar para produtos
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-1.5 text-sm text-muted">/produto/{product.slug}</p>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-dim">Dados do produto</h2>
        <Card className="p-6 sm:p-8">
          <ProductForm action={boundUpdate} product={product} submitLabel="Salvar alterações" />
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-dim">
          Conteúdos ({product.contents.length})
        </h2>
        <div className="space-y-4">
          {product.contents.map((content) => (
            <ContentEditor key={content.id} content={content} productId={product.id} />
          ))}
          <NewContentForm productId={product.id} />
        </div>
      </section>
    </div>
  );
}
