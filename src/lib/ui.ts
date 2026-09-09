// Shared Tailwind class strings for form controls, so every form (booking,
// staff login, patient login/register) looks and behaves the same instead
// of each one re-deriving its own input/button styling.
export const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClass = "block text-sm font-medium";

export const primaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
