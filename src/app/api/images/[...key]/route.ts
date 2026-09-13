import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getObjectBuffer } from "@/lib/storage";

/**
 * Serve imagens de capa (produto/conteúdo) enviadas via admin. Diferente do
 * /api/download/[fileId], aqui não há checagem de posse do produto — a capa
 * precisa aparecer mesmo para produtos bloqueados (upsell). Só exige sessão
 * autenticada, já que toda a plataforma fica atrás de login.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/images/[...key]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { key } = await ctx.params;
  const storageKey = key.join("/");

  try {
    const { buffer, contentType } = await getObjectBuffer(storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }
}
