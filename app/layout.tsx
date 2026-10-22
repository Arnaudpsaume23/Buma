import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import { BumaProvider } from "@/lib/store";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Buma — Tontine journalière + Loto Gabon",
  description:
    "Tontine rotative quotidienne pour les vendeuses du marché Mont-Bouët. Tirage 18h, anti-fuite.",
  applicationName: "Buma",
  appleWebApp: { capable: true, title: "Buma", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#009e60",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <BumaProvider>
          <AppChrome>{children}</AppChrome>
        </BumaProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
