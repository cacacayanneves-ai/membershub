import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/auth/session";

/**
 * Sempre relê o usuário do banco (nunca confia só no JWT) para decisões de
 * autorização: status pode ter mudado, senha pode ter sido revogada, etc.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.status !== "ACTIVE") return null;

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    await destroySession();
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
