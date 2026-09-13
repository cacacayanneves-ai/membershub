"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateProvisionalPassword } from "@/lib/auth/password";
import { sendAccessEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export type ForgotState = { submitted?: boolean };

export async function forgotPasswordAction(
  _prevState: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const parsed = schema.safeParse({ email: formData.get("email") });

  // Sempre responde com sucesso (mesma mensagem), para não revelar quais e-mails existem.
  if (!parsed.success) return { submitted: true };

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.status === "ACTIVE") {
    const newPassword = generateProvisionalPassword();
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    });
    await sendAccessEmail({
      name: user.name,
      email: user.email,
      password: newPassword,
      productName: "Members Hub",
    });
  }

  return { submitted: true };
}
