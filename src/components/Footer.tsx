import { clinicInfo } from "@/lib/clinic-data";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {clinicInfo.name}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
