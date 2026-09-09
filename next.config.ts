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
    ];
  },
};

export default nextConfig;
