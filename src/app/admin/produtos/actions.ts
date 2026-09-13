"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  benefits: z.string().optional(),
  imageUrl: z.string().url("URL de imagem inválida.").optional().or(z.literal("")),
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

  const slug = await findFreeSlug(slugify(parsed.data.name));

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      benefits: parsed.data.benefits || null,
      imageUrl: parsed.data.imageUrl || null,
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

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      benefits: parsed.data.benefits || null,
      imageUrl: parsed.data.imageUrl || null,
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
