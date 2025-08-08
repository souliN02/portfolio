import "./globals.css";

export const metadata = { title: "XP Portfolio" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
