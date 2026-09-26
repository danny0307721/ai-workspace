import "./globals.css";
import type { Metadata } from "next";
import SiteNav from "./components/site-nav";

export const metadata: Metadata = {
  title: "Ledger AI",
  description: "Import and sales ledger with AI analysis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <header className="site-header">
      <a className="brand" href="/">Ledger AI</a>
      <SiteNav />
    </header>
    {children}
  </body></html>;
}