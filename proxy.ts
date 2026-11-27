import { NextResponse, type NextRequest } from "next/server";

/**
 * Testovací prostředí (docs/ROZHODNUTI.md, 2026-11-27).
 * Dokud není SITE_PUBLIC=true, posílá každá odpověď noindex (spolu s robots.txt
 * a meta robots), takže web neindexují vyhledávače. Heslo je volitelné: když je
 * nastavená proměnná SITE_PASSWORD, chce web HTTP Basic Auth (libovolné jméno).
 */
export function proxy(request: NextRequest) {
  if (process.env.SITE_PUBLIC === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;
  if (password) {
    const auth = request.headers.get("authorization");
    const decoded = auth?.startsWith("Basic ") ? atob(auth.slice(6)) : "";
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (!auth || given !== password) {
      return new NextResponse("Připravujeme. / Coming soon.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="LEGS:ON", charset="UTF-8"',
          "X-Robots-Tag": "noindex, nofollow",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
