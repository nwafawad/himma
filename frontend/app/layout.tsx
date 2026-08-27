import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum — Quiet reflection for self-directed learners",
  description: "Log study activity and view AI-generated career direction insights.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Momentum",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} bg-canvas text-charcoal min-h-screen flex flex-col font-sans selection:bg-[#A5B4FC]`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
