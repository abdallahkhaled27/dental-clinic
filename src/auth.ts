import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { findOrCreatePatientFromGoogle } from "@/lib/patient-auth";

// Auth.js handles only the OAuth handshake with Google here — verifying
// the redirect, exchanging the code for tokens, confirming the identity.
// It is NOT our ongoing session system: the signIn callback below bridges
// straight into the same Patient/PatientSession tables and patient_session
// cookie that email/password login uses (see patient-auth.ts), so every
// existing check (proxy.ts, verifyPatientSession, the booking/dashboard
// gating) keeps working unchanged regardless of which way someone signed
// in. Auth.js still sets its own session cookie alongside ours — harmless,
// just unused after this request.
export const { handlers, signIn, signOut } = NextAuth({
  // Auth.js validates the incoming Host header against a trusted value by
  // default and refuses otherwise (UntrustedHost) — a real protection
  // against host-header injection, but it has no way to know our actual
  // deployed host in advance (Vercel serves this from multiple hostnames:
  // the production domain, preview URLs, ...). Vercel's own edge network
  // is what terminates and sets that header, so trusting it here is safe;
  // this is Vercel's documented recommendation for Auth.js deployments.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Google-verified emails only — profile.email_verified is true for
      // every account Google will hand us here, but bail out rather than
      // create a patient with no email if something upstream ever changes.
      if (!user.email) return false;
      await findOrCreatePatientFromGoogle(user.email, user.name ?? user.email);
      return true;
    },
  },
});
