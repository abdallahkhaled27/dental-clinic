import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of next/link and next/navigation — every
// (site)-tree component should import Link/useRouter/redirect from here
// instead of "next/link"/"next/navigation" directly, so a link written
// as href="/book" automatically becomes /ar/book when rendered on an
// Arabic page instead of silently dropping the visitor back into English.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
