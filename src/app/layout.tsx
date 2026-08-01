import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// `variable` exposes Inter's real, self-hosted font-family stack as a CSS
// custom property so Tailwind's `font-sans` utility (globals.css's @theme)
// can resolve to it, rather than hardcoding a "Inter" font-family string
// that would drift from whatever next/font actually loads.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Trailhead",
  description: "Repository Intelligence Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} bg-bg min-h-screen`}>{children}</body>
    </html>
  );
}
