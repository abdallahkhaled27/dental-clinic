import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { getSessionByToken } from "@/lib/auth";
import { getPatientSessionByToken } from "@/lib/patient-auth";

const handleI18nRouting = createMiddleware(routing);

// Real per-user authentication (Feature 9), replacing Feature 4's temporary
// shared-password Basic Auth. Redirects to /admin/login instead of
// returning a browser-native auth popup, since a real login page can show
// validation errors and gives us somewhere for a logout button to send
// people back to.
//
// Two independent gates live here, on two entirely separate session
// systems (see patient-auth.ts for why): /admin needs a signed-in staff
// member, /book and /dashboard need a signed-in patient. Neither cookie
// can satisfy the other's check.
//
// (Cache-Control: no-store on these same routes — so a signed-out visitor
// can't hit Back and see a bfcache-restored copy of a protected page — is
// set in next.config.ts instead of here: headers set on NextResponse.next()
// in middleware get overwritten by the framework's own response headers
// before the page is actually served, so it has no effect from this file.)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // The login page itself lives under /admin (so it shares the minimal
    // internal layout instead of the public site's header/footer/chat —
    // see admin/layout.tsx) but obviously can't require a session to view,
    // or signing in would redirect-loop against itself.
    if (pathname === "/admin/login") {
      return;
    }
    const token = request.cookies.get("session")?.value;
    const session = await getSessionByToken(token);
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return;
  }

  // Everything else lives under the [locale] tree, so next-intl decides
  // routing (locale detection/redirect, the /ar prefix) for it. Computed
  // up front so both the auth check below and the header hand-off to
  // app/layout.tsx (which can't read a [locale] route param itself, see
  // the note there) use the same answer.
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const locale = isArabic ? "ar" : "en";
  const intlResponse = handleI18nRouting(request);
  intlResponse.headers.set("x-locale", locale);

  // /book and /dashboard need a signed-in patient regardless of which
  // locale they're viewed in — strip the optional "/ar" prefix to get the
  // logical path "as-needed" prefixing means English never has.
  const logicalPath = isArabic ? pathname.slice(3) || "/" : pathname;
  if (logicalPath.startsWith("/book") || logicalPath.startsWith("/dashboard")) {
    const token = request.cookies.get("patient_session")?.value;
    const session = await getPatientSessionByToken(token);
    if (!session) {
      const loginUrl = new URL(isArabic ? "/ar/login" : "/login", request.url);
      // The logical path, not the real one — see the contract note on
      // "next"/"redirectTo" in login/page.tsx for why: everything
      // downstream that re-navigates using this value goes through the
      // locale-aware router, which expects a locale-free path and adds
      // the right prefix itself.
      loginUrl.searchParams.set("next", logicalPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  // Admin (handled entirely separately above) plus everything next-intl
  // needs to see in order to route locales correctly — every page except
  // API routes, Next's internals, and static files.
  matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
