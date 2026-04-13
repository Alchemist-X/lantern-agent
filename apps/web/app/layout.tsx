import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "../components/dashboard-shell";
import { LocaleProvider } from "../lib/locale-context";

export const metadata: Metadata = {
  title: "Lantern Agent — Autonomous DEX Trading Agent on X Layer",
  description: "Autonomous AI agent trading on X Layer DEX. Token pair discovery, Kelly Criterion sizing, live positions & P&L.",
  metadataBase: new URL("https://lantern-pizza-spectator.vercel.app"),
  openGraph: {
    title: "Lantern Agent — Autonomous DEX Trading Agent on X Layer",
    description: "Autonomous AI agent trading on X Layer DEX. Token pair discovery, Kelly Criterion sizing, live positions & P&L.",
    siteName: "Lantern",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Lantern Agent — Autonomous DEX Trading Agent on X Layer",
    description: "Autonomous AI agent trading on X Layer DEX."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="dash-body">
        <LocaleProvider>
          <DashboardShell>{children}</DashboardShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
