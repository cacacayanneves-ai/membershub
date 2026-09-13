import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { toggleProductStatusAction, deleteProductAction } from "./actions";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { contents: true, userProducts: true } } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-1.5 text-sm text-muted">Cadastre e organize os produtos da sua plataforma.</p>
        </div>
        <LinkButton href="/admin/produtos/novo">
          <Plus className="size-4" />
          Novo produto
        </LinkButton>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed p-12 text-center text-sm text-muted">
          Nenhum produto cadastrado ainda.
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/produtos/${product.id}`} className="truncate font-medium hover:text-accent">
                    {product.name}
                  </Link>
                  <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                    {product.status === "ACTIVE" ? "Ativo" : "Rascunho"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-dim">
                  {product._count.contents} conteúdo(s) · {product._count.userProducts} cliente(s) com acesso
                  {product.hotmartProductId ? ` · Hotmart ID: ${product.hotmartProductId}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/produtos/${product.id}`}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  Editar
                </Link>
                <form action={toggleProductStatusAction.bind(null, product.id, product.status)}>
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    {product.status === "ACTIVE" ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={deleteProductAction.bind(null, product.id)}>
                  <ConfirmSubmitButton
                    variant="danger"
                    confirmText={`Excluir "${product.name}"? Isso remove todos os conteúdos e acessos vinculados.`}
                  >
                    Excluir
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
