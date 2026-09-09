import Link from "next/link";

// Rendered inside the bare root layout (not the (site) route group), so no
// Header/Footer/ChatWidget import here — this stays a small, self-contained
// page rather than reaching into the public site's chrome.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
      >
        Back to home
      </Link>
    </main>
  );
}
