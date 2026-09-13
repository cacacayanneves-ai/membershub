"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { storeFile, deleteFile, generateStorageKey, extractOwnedImageKey, getUploadUrl } from "@/lib/storage";

const contentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  description: z.string().optional(),
  order: z.string().optional(),
  releaseAfterDays: z.string().optional(),
});

export type ContentFormState = { error?: string };

/** Processa o upload opcional de imagem do conteúdo, mantendo a atual se nada for enviado. */
async function resolveContentImageUpload(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  const currentImageUrl = (formData.get("currentImageUrl") as string) || null;

  if (!(file instanceof File) || file.size === 0) {
    return currentImageUrl;
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Imagem muito grande (máx. 10MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey("content-covers", file.name);
  await storeFile(key, buffer, file.type || "application/octet-stream");

  const oldKey = extractOwnedImageKey(currentImageUrl);
  if (oldKey) await deleteFile(oldKey);

  return `/api/images/${key}`;
}

export async function createContentAction(
  productId: string,
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  await requireAdmin();
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let imageUrl: string | null;
  try {
    imageUrl = await resolveContentImageUpload(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar a imagem." };
  }

  await prisma.content.create({
    data: {
      productId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl,
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

  let imageUrl: string | null;
  try {
    imageUrl = await resolveContentImageUpload(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar a imagem." };
  }

  await prisma.content.update({
    where: { id: contentId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl,
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
    const imageKey = extractOwnedImageKey(content.imageUrl);
    if (imageKey) await deleteFile(imageKey);
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
  const key = generateStorageKey(`contents/${contentId}`, file.name);
  await storeFile(key, buffer, file.type || "application/octet-stream");

  await prisma.contentFile.create({
    data: { contentId, label, storageKey: key, sizeBytes: file.size, order: await nextFileOrder(contentId) },
  });

  revalidatePath(`/admin/produtos/${productId}`);
  return {};
}

async function nextFileOrder(contentId: string) {
  const lastFile = await prisma.contentFile.findFirst({ where: { contentId }, orderBy: { order: "desc" } });
  return (lastFile?.order ?? -1) + 1;
}

export type PresignResult = { error?: string; direct?: boolean; uploadUrl?: string; key?: string };

/**
 * Passo 1 do upload direto pro R2: gera a URL assinada. O navegador manda o
 * arquivo direto pra ela (PUT), sem passar pelo corpo da função da Vercel.
 * No driver local não há URL assinada — `direct: false` avisa o cliente pra
 * usar `uploadContentFileAction` (upload comum) como alternativa.
 */
export async function requestContentFileUploadUrl(
  contentId: string,
  filename: string,
  contentType: string,
  fileSize: number
): Promise<PresignResult> {
  await requireAdmin();
  if (fileSize > 500 * 1024 * 1024) {
    return { error: "Arquivo muito grande (máx. 500MB)." };
  }

  const key = generateStorageKey(`contents/${contentId}`, filename);
  const uploadUrl = await getUploadUrl(key, contentType || "application/octet-stream");
  if (!uploadUrl) return { direct: false };
  return { direct: true, uploadUrl, key };
}

/** Passo 2 do upload direto: depois que o navegador confirma que o PUT no R2 deu certo,
 * grava o registro do arquivo no banco (aqui não trafega o arquivo, só metadados). */
export async function confirmContentFileUpload(
  contentId: string,
  productId: string,
  key: string,
  label: string,
  sizeBytes: number
): Promise<{ error?: string }> {
  await requireAdmin();
  await prisma.contentFile.create({
    data: { contentId, label, storageKey: key, sizeBytes, order: await nextFileOrder(contentId) },
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
