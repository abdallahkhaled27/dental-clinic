import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route.
        source: "/:path*",
        headers: [
          // Stops the browser from guessing a file's type from its
          // content — without this, a response served as "text/plain"
          // could still be run as a script in some older browsers.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nothing in this app has a legitimate reason to be embedded in
          // another site's <iframe> — this blocks clickjacking attempts
          // that rely on doing exactly that.
          { key: "X-Frame-Options", value: "DENY" },
          // Limits how much of our URLs get sent as the "Referer" header
          // when a link from this site is clicked, without breaking
          // same-origin navigation.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // We never use the camera, microphone, or geolocation — turning
          // them off here means even a future XSS bug couldn't invoke them.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Protected pages (see proxy.ts's matcher for the same list): the
      // framework's own default for dynamic routes is "no-cache,
      // must-revalidate", which still lets the browser keep a copy and
      // just asks it to revalidate — that's not enough to keep a page out
      // of the back/forward cache. "no-store" is what actually stops a
      // signed-out visitor from hitting Back after logout and seeing a
      // bfcache-restored copy of a protected page, with no request ever
      // reaching the server to re-check the (now-gone) session.
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/book/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
