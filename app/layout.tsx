import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PROFILE, SITE_URL } from "@/data/profile";
import "./globals.css";

const title = `${PROFILE.name} | ${PROFILE.role}`;
const description = `Portfolio of ${PROFILE.name}, a full-stack developer building production software AI-first with React, Next.js, TypeScript, Python and C#. Styled as a Windows XP desktop.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "Portfolio XP",
  authors: [{ name: PROFILE.name, url: SITE_URL }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: PROFILE.name,
    title,
    description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#245edb",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
