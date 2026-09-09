import { NextResponse, type NextRequest } from "next/server";
import { getSessionByToken } from "@/lib/auth";
import { getPatientSessionByToken } from "@/lib/patient-auth";

// Real per-user authentication (Feature 9), replacing Feature 4's temporary
// shared-password Basic Auth. Redirects to /login instead of returning a
// browser-native auth popup, since a real login page can show validation
// errors and gives us somewhere for a logout button to send people back to.
//
// Two independent gates live here, on two entirely separate session
// systems (see patient-auth.ts for why): /admin needs a signed-in staff
// member, /book and /patient/dashboard need a signed-in patient. Neither
// cookie can satisfy the other's check.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("session")?.value;
    const session = await getSessionByToken(token);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
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
