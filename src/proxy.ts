import { NextResponse, type NextRequest } from "next/server";

// HTTP Basic Auth per il back-office. Da usare solo su HTTPS (HSTS attivo).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  const header = req.headers.get("authorization") ?? "";
  if (user && password && header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    if (sep > 0 && timingSafeEqual(decoded.slice(0, sep), user) && timingSafeEqual(decoded.slice(sep + 1), password)) {
      return NextResponse.next();
    }
  }
  return new NextResponse("Autenticazione richiesta", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Attracco admin", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
