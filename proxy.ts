import { NextResponse, type NextRequest } from "next/server";

/**
 * Skrytý web do dne D (docs/ROZHODNUTI.md, 2026-11-26).
 * Dokud není SITE_PUBLIC=true, je celý web za heslem (HTTP Basic Auth,
 * heslo v proměnné SITE_PASSWORD, libovolné jméno) a posílá noindex.
 * Bez SITE_PASSWORD zůstává zavřený úplně – zavřeno je výchozí stav.
 */
export function proxy(request: NextRequest) {
  if (process.env.SITE_PUBLIC === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;
  const auth = request.headers.get("authorization");
  if (password && auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given === password) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
  }

  return new NextResponse("Připravujeme. / Coming soon.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="LEGS:ON", charset="UTF-8"',
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
