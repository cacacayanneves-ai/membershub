"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";
import { storeFile, deleteFile, generateStorageKey, extractOwnedImageKey } from "@/lib/storage";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  benefits: z.string().optional(),
  hotmartProductId: z.string().optional(),
  checkoutUrl: z.string().url("URL de checkout inválida.").optional().or(z.literal("")),
  price: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT"]),
  order: z.string().optional(),
});

export type ProductFormState = { error?: string };

function parsePriceToCents(price?: string) {
  if (!price) return null;
  const normalized = price.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

async function findFreeSlug(base: string) {
  let slug = base || "produto";
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/** Processa o upload opcional de imagem de capa. Retorna a URL final (mantém a
 * atual se nenhum arquivo novo foi enviado) e limpa o arquivo antigo do storage. */
async function resolveImageUpload(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  const currentImageUrl = (formData.get("currentImageUrl") as string) || null;

  if (!(file instanceof File) || file.size === 0) {
    return currentImageUrl;
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Imagem muito grande (máx. 10MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey("products", file.name);
  await storeFile(key, buffer, file.type || "application/octet-stream");

  const oldKey = extractOwnedImageKey(currentImageUrl);
  if (oldKey) await deleteFile(oldKey);

  return `/api/images/${key}`;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const hotmartProductId = parsed.data.hotmartProductId?.trim() || null;
  if (hotmartProductId) {
    const existing = await prisma.product.findUnique({ where: { hotmartProductId } });
    if (existing) return { error: "Já existe um produto com esse Hotmart Product ID." };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await resolveImageUpload(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar a imagem." };
  }

  const slug = await findFreeSlug(slugify(parsed.data.name));

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      benefits: parsed.data.benefits || null,
      imageUrl,
      hotmartProductId,
      checkoutUrl: parsed.data.checkoutUrl || null,
      priceCents: parsePriceToCents(parsed.data.price),
      status: parsed.data.status,
      order: Number(parsed.data.order) || 0,
    },
  });

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${product.id}`);
}

export async function updateProductAction(
  productId: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const hotmartProductId = parsed.data.hotmartProductId?.trim() || null;
  if (hotmartProductId) {
    const existing = await prisma.product.findUnique({ where: { hotmartProductId } });
    if (existing && existing.id !== productId) {
      return { error: "Já existe um produto com esse Hotmart Product ID." };
    }
  }

  let imageUrl: string | null;
  try {
    imageUrl = await resolveImageUpload(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar a imagem." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      benefits: parsed.data.benefits || null,
      imageUrl,
      hotmartProductId,
      checkoutUrl: parsed.data.checkoutUrl || null,
      priceCents: parsePriceToCents(parsed.data.price),
      status: parsed.data.status,
      order: Number(parsed.data.order) || 0,
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}`);
  return {};
}

export async function toggleProductStatusAction(
  productId: string,
  currentStatus: "ACTIVE" | "DRAFT",
  _formData: FormData
) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { status: currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE" },
  });
  revalidatePath("/admin/produtos");
}

export async function deleteProductAction(productId: string, _formData: FormData) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
