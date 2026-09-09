"use client";

import { signIn } from "next-auth/react";

// next-auth/react's signIn() works standalone here — no <SessionProvider>
// needed, since we never call useSession() anywhere. Our own auth state
// (verifyPatientSession, /api/patient/me) is the one source of truth for
// "is this patient signed in", regardless of which method they used.
export default function GoogleSignInButton({ redirectTo }: { redirectTo: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: redirectTo })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.1A12 12 0 0012 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.3a7.2 7.2 0 010-4.6v-3.1H1.27a12 12 0 000 10.8l4.01-3.1z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.4 0 3.42 2.62 1.27 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
