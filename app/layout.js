import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Bekir Saliv — Full-stack Developer",
  description:
    "Portfolio of Bekir Saliv, a full-stack developer building production software AI-first with React, Next.js, TypeScript, Python and C#. Styled as a Windows XP desktop.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
