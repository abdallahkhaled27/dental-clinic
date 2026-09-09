import { clinicInfo } from "@/lib/clinic-data";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm opacity-70">
        <p>
          © {new Date().getFullYear()} {clinicInfo.name}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
