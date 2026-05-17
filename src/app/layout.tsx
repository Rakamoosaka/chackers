import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chackers",
  description: "Competitive checkers with AI coaching and progression.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
