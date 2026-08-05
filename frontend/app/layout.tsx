import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/navigation/Header";
import QuickCaptureModal from "@/components/ui/QuickCaptureModal";
import PageTransition from "@/components/ui/PageTransition";
import FloatingLogButton from "@/components/ui/FloatingLogButton";

const serifFont = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Momentum — Quiet reflection for self-directed learners",
  description: "Log study activity and view AI-generated career direction insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable}`}>
      <body className="bg-canvas text-charcoal min-h-screen flex flex-col font-sans selection:bg-[#A5B4FC]">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <QuickCaptureModal />
        <FloatingLogButton />
      </body>
    </html>
  );
}
