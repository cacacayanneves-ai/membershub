"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { storeFile, deleteFile, generateStorageKey } from "@/lib/storage";

const contentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  description: z.string().optional(),
  imageUrl: z.string().url("URL de imagem inválida.").optional().or(z.literal("")),
  order: z.string().optional(),
  releaseAfterDays: z.string().optional(),
});

export type ContentFormState = { error?: string };

export async function createContentAction(
  productId: string,
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  await requireAdmin();
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await prisma.content.create({
    data: {
      productId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      order: Number(parsed.data.order) || 0,
      releaseAfterDays: Math.max(0, Number(parsed.data.releaseAfterDays) || 0),
    },
  });

  revalidatePath(`/admin/produtos/${productId}`);
  return {};
}

export async function updateContentAction(
  contentId: string,
  productId: string,
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  await requireAdmin();
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await prisma.content.update({
    where: { id: contentId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      order: Number(parsed.data.order) || 0,
      releaseAfterDays: Math.max(0, Number(parsed.data.releaseAfterDays) || 0),
    },
  });

  revalidatePath(`/admin/produtos/${productId}`);
  return {};
}

export async function deleteContentAction(contentId: string, productId: string, _formData: FormData) {
  await requireAdmin();
  const content = await prisma.content.findUnique({ where: { id: contentId }, include: { files: true } });
  if (content) {
    await Promise.all(content.files.map((f) => deleteFile(f.storageKey)));
  }
  await prisma.content.delete({ where: { id: contentId } });
  revalidatePath(`/admin/produtos/${productId}`);
}

export type FileFormState = { error?: string };

export async function uploadContentFileAction(
  contentId: string,
  productId: string,
  _prev: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { error: "Arquivo muito grande (máx. 100MB)." };
  }

  const label = (formData.get("label") as string)?.trim() || file.name;
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey(contentId, file.name);
  await storeFile(key, buffer, file.type || "application/octet-stream");

  const lastFile = await prisma.contentFile.findFirst({ where: { contentId }, orderBy: { order: "desc" } });

  await prisma.contentFile.create({
    data: {
      contentId,
      label,
      storageKey: key,
      sizeBytes: file.size,
      order: (lastFile?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/produtos/${productId}`);
  return {};
}

export async function deleteContentFileAction(fileId: string, productId: string, _formData: FormData) {
  await requireAdmin();
  const file = await prisma.contentFile.findUnique({ where: { id: fileId } });
  if (file) {
    await deleteFile(file.storageKey);
    await prisma.contentFile.delete({ where: { id: fileId } });
  }
  revalidatePath(`/admin/produtos/${productId}`);
}
