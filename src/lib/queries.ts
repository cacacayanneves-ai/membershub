import "server-only";
import { prisma } from "@/lib/prisma";
import { isContentUnlocked, daysUntilUnlock } from "@/lib/drip";

export async function getMyProducts(userId: string) {
  const userProducts = await prisma.userProduct.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      product: { include: { contents: { orderBy: { order: "asc" } } } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  return userProducts.map((up) => {
    const contents = up.product.contents.map((content) => ({
      ...content,
      unlocked: isContentUnlocked(up.accessStart, content.releaseAfterDays),
      daysUntilUnlock: daysUntilUnlock(up.accessStart, content.releaseAfterDays),
    }));

    return {
      userProduct: up,
      product: up.product,
      contents,
      unlockedCount: contents.filter((c) => c.unlocked).length,
      nextToUnlock: contents.find((c) => !c.unlocked) ?? null,
    };
  });
}

export async function getOtherProducts(userId: string) {
  const owned = await prisma.userProduct.findMany({
    where: { userId, status: "ACTIVE" },
    select: { productId: true },
  });
  const ownedIds = owned.map((o) => o.productId);

  return prisma.product.findMany({
    where: { status: "ACTIVE", id: { notIn: ownedIds.length ? ownedIds : undefined } },
    orderBy: { order: "asc" },
  });
}

/**
 * Resolve um produto pelo slug para o contexto de um usuário específico.
 * Retorna `owned: false` (com dados de vitrine) quando o usuário não tem acesso —
 * a decisão de mostrar conteúdo ou a oferta bloqueada é sempre feita aqui, no
 * servidor, nunca no cliente.
 */
export async function getProductForUser(userId: string, slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { contents: { orderBy: { order: "asc" }, include: { files: { orderBy: { order: "asc" } } } } },
  });
  if (!product) return null;

  const userProduct = await prisma.userProduct.findFirst({
    where: { userId, productId: product.id, status: "ACTIVE" },
  });

  if (!userProduct) {
    // Produto em rascunho não deve aparecer para quem não tem acesso.
    if (product.status !== "ACTIVE") return null;
    return { owned: false as const, product };
  }

  const contents = product.contents.map((content) => ({
    ...content,
    unlocked: isContentUnlocked(userProduct.accessStart, content.releaseAfterDays),
    daysUntilUnlock: daysUntilUnlock(userProduct.accessStart, content.releaseAfterDays),
  }));

  return { owned: true as const, product, userProduct, contents };
}
