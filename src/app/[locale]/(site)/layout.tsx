import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

// The public-facing shell: marketing nav, footer, and the patient-facing
// chat widget. Everything under this route group gets it (home, booking,
// staff login, patient login/register/dashboard) — /admin deliberately
// does not, see its own layout.tsx for why.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatWidget />
    </>
  );
}
