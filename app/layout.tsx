import "./globals.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { AppSettingsProvider } from "./components/settings-provider";
import SiteNav from "./components/site-nav";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Ledger AI",
  description: "Import and sales ledger with AI analysis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={roboto.variable}><body>
    <AppSettingsProvider>
      <header className="site-header">
        <a className="brand" href="/">Ledger AI</a>
        <SiteNav />
      </header>
      {children}
    </AppSettingsProvider>
  </body></html>;
}