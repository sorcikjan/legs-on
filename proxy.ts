import { NextResponse, type NextRequest } from "next/server";
import { editorFrom, usesBasicAuth } from "@/lib/editor";

/**
 * 1. Administrace (/admin) je jen pro přihlášené (lib/editor.ts).
 * 2. Testovací prostředí (docs/ROZHODNUTI.md, 2026-11-27): dokud není SITE_PUBLIC=true, posílá
 *    každá odpověď noindex (spolu s robots.txt a meta robots). Volitelné heslo na celý web:
 *    proměnná SITE_PASSWORD (HTTP Basic Auth, libovolné jméno).
 */
const NOINDEX = "noindex, nofollow";

function askForLogin(realm: string, body: string) {
  return new NextResponse(body, {
    status: 401,
    headers: {
      ...(usesBasicAuth() && { "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"` }),
      "X-Robots-Tag": NOINDEX,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!(await editorFrom(request.headers))) return askForLogin("LEGS:ON administrace", "Přihlášení do administrace.");
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", NOINDEX);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  if (process.env.SITE_PUBLIC === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;
  if (password) {
    const auth = request.headers.get("authorization");
    const decoded = auth?.startsWith("Basic ") ? atob(auth.slice(6)) : "";
    if (!auth || decoded.slice(decoded.indexOf(":") + 1) !== password) {
      return askForLogin("LEGS:ON", "Připravujeme. / Coming soon.");
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
}
