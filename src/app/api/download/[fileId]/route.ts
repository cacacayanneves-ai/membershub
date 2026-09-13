import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { isContentUnlocked } from "@/lib/drip";
import { getFileForDownload } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/download/[fileId]">) {
  const { fileId } = await ctx.params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const file = await prisma.contentFile.findUnique({
    where: { id: fileId },
    include: { content: true },
  });
  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  // Admin pode baixar qualquer arquivo para conferência; cliente precisa ter o produto liberado.
  if (user.role !== "ADMIN") {
    const userProduct = await prisma.userProduct.findFirst({
      where: { userId: user.id, productId: file.content.productId, status: "ACTIVE" },
    });
    if (!userProduct) {
      return NextResponse.json({ error: "Você não tem acesso a este produto." }, { status: 403 });
    }
    if (!isContentUnlocked(userProduct.accessStart, file.content.releaseAfterDays)) {
      return NextResponse.json({ error: "Este conteúdo ainda não foi liberado." }, { status: 403 });
    }
  }

  const result = await getFileForDownload(file.storageKey, file.label);

  if (result.type === "redirect") {
    return NextResponse.redirect(result.url);
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.label)}"`,
      "Content-Length": String(result.buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
