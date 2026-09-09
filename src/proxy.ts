import { NextResponse, type NextRequest } from "next/server";
import { getSessionByToken } from "@/lib/auth";
import { getPatientSessionByToken } from "@/lib/patient-auth";

// Real per-user authentication (Feature 9), replacing Feature 4's temporary
// shared-password Basic Auth. Redirects to /admin/login instead of
// returning a browser-native auth popup, since a real login page can show
// validation errors and gives us somewhere for a logout button to send
// people back to.
//
// Two independent gates live here, on two entirely separate session
// systems (see patient-auth.ts for why): /admin needs a signed-in staff
// member, /book and /patient/dashboard need a signed-in patient. Neither
// cookie can satisfy the other's check.
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

  const token = request.cookies.get("patient_session")?.value;
  const session = await getPatientSessionByToken(token);
  if (!session) {
    const loginUrl = new URL("/patient/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/book/:path*", "/patient/dashboard/:path*"],
};
