"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha provisória."),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type FirstAccessState = { error?: string };

export async function firstAccessAction(
  _prevState: FirstAccessState,
  formData: FormData
): Promise<FirstAccessState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const currentValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!currentValid) {
    return { error: "Senha atual incorreta." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}
