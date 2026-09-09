import { NextResponse, type NextRequest } from "next/server";
import { getSessionByToken } from "@/lib/auth";

// Real per-user authentication (Feature 9), replacing Feature 4's temporary
// shared-password Basic Auth. Redirects to /login instead of returning a
// browser-native auth popup, since a real login page can show validation
// errors and gives us somewhere for a logout button to send people back to.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const session = await getSessionByToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: "/admin/:path*",
};
