import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/produto", "/admin", "/primeiro-acesso"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Checagem leve, só para UX (evitar renderizar a página antes de redirecionar).
 * A autorização de verdade (usuário ativo, role, direito ao produto específico,
 * data de liberação do conteúdo) é sempre refeita no servidor em cada página/action,
 * porque Server Functions podem ser chamadas sem passar pelo Proxy.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get("mh_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.redirect(new URL("/login", request.url));

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/produto/:path*", "/admin/:path*", "/primeiro-acesso"],
};
