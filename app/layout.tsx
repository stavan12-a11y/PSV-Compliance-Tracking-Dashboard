import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getDb } from "@/lib/store";
import { allTrapViews, computeKPIs } from "@/lib/logic";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Steam Trap Management",
  description: "Preventive maintenance tracking for industrial steam traps",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kpis = computeKPIs(allTrapViews(getDb()));

  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <div className="app">
          <Sidebar issueCount={kpis.active_issues} />
          <div className="main">{children}</div>
        </div>
      </body>
    </html>
  );
}
